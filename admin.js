import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, doc, collection, onSnapshot, query, orderBy, setDoc, deleteDoc, addDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getStorage, ref, uploadString, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";
import { firebaseConfig } from "./firebase-config.js";

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);
const auth = getAuth(firebaseApp);
const storage = getStorage(firebaseApp);

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. Authentication and Session State ---
    const loginOverlay = document.getElementById('admin-login-overlay');
    const dashboardView = document.getElementById('admin-dashboard-view');
    const loginForm = document.getElementById('admin-login-form');
    const passwordInput = document.getElementById('admin-password-input');
    const loginErrorMsg = document.getElementById('login-error-msg');
    const logoutBtn = document.getElementById('admin-logout-btn');

    let projectsUnsubscribe = null;
    let slidesUnsubscribe = null;

    onAuthStateChanged(auth, (user) => {
        if (user) {
            if (loginOverlay) loginOverlay.style.display = 'none';
            if (dashboardView) dashboardView.style.display = 'block';
            initDashboard();
        } else {
            if (loginOverlay) loginOverlay.style.display = 'flex';
            if (dashboardView) dashboardView.style.display = 'none';
            
            // Clean up listeners on logout
            if (projectsUnsubscribe) projectsUnsubscribe();
            if (slidesUnsubscribe) slidesUnsubscribe();
        }
    });

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const adminEmail = "admin@clickcg.com";
            const inputPass = passwordInput.value;
            
            try {
                await signInWithEmailAndPassword(auth, adminEmail, inputPass);
                if (loginErrorMsg) loginErrorMsg.textContent = '';
            } catch (error) {
                console.error("Login failed:", error);
                if (loginErrorMsg) {
                    loginErrorMsg.textContent = '비밀번호가 올바르지 않거나 인증에 실패했습니다.';
                }
                passwordInput.value = '';
                passwordInput.focus();
            }
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await signOut(auth);
            window.location.reload();
        });
    }


    // --- 2. Cloud Database Fallback Seeding ---
    const SEED_SLIDES = [
        "assets/birds_eye_view.png",
        "assets/perspective_view.png",
        "assets/architectural_cg.png",
        "assets/simulation.png"
    ];

    const SEED_PROJECTS = [
        {
            id: 1,
            title: "송도 테크노파크 랜드마크 타워",
            category: "birds-eye",
            imgUrl: "assets/birds_eye_view.png",
            software: "3ds Max, Corona Renderer, Photoshop",
            scope: "대지 모델링, 건축 매스 모델링, 조명 세팅, 포스트 프로덕션 리터칭",
            date: "2026년 04월",
            client: "송도 테크노 파크 건설 본부",
            desc: "송도 국제도시에 위치한 테크노파크 랜드마크 타워의 마스터플랜 조감도입니다. 복합 문화 공간과 오피스 타워의 매싱을 주변 환경과 조화롭게 녹여냈으며, 석양 무렵의 반사광과 극적인 골든아워 라이팅을 연출하여 미래지향적인 도시 이미지를 강조했습니다."
        },
        {
            id: 2,
            title: "한남 테라스 레지던스",
            category: "perspective",
            imgUrl: "assets/perspective_view.png",
            software: "3ds Max, V-Ray, Photoshop",
            scope: "익스테리어 및 인테리어 모델링, 정밀 마감재 매핑, 가구 및 소품 세팅, 환경 라이팅",
            date: "2026년 03월",
            client: "한남 포레스트 힐 개발",
            desc: "고급 주거 단지 한남 테라스 레지던스의 거실 및 외부 테라스 투시도입니다. 자연 채광이 실내로 깊숙이 들어오는 부드러운 화이트 밸런스 라이팅을 적용하고, 천연 대리석 및 오크 원목 마감재의 질감을 완벽히 묘사하여 하이엔드 주거 공간의 고급스러움을 극대화했습니다."
        },
        {
            id: 3,
            title: "동탄 숲속 현대미술관 신축 공사",
            category: "interior",
            imgUrl: "assets/architectural_cg.png",
            software: "Rhino, 3ds Max, Corona Renderer",
            scope: "비정형 건축 외피 모델링, 정밀 유리 질감 표현, 조경 레이아웃 및 렌더링",
            date: "2025년 12월",
            client: "경기문화재단",
            desc: "숲의 일부처럼 자연에 동화되는 동탄 숲속 현대미술관의 건축 CG입니다. 라이노로 설계된 복잡한 비정형 파사드를 3ds Max로 임포트하여 최적화하고, 거친 노출 콘크리트와 반투명 U-Glass의 물성 대비를 정교하게 시뮬레이션하여 건축가의 예술적 의도를 사실적으로 표현했습니다."
        },
        {
            id: 4,
            title: "부산 해운대 스마트 크루즈 터미널",
            category: "simulation",
            imgUrl: "assets/simulation.png",
            software: "Unreal Engine 5, 3ds Max, After Effects",
            scope: "언리얼 엔진 5 라이브 시뮬레이션, 대규모 파티클 물 시뮬레이션, 카메라 워크 연출",
            date: "2025년 10월",
            client: "부산항만공사",
            desc: "해운대 신규 스마트 크루즈 터미널의 3D 애니메이션 시뮬레이션 프로젝트입니다. 언리얼 엔진 5의 루멘(Lumen) 시스템을 활용해 실시간 주야간 광원 변화를 정밀하게 재현했으며, 선박의 접안 과정과 보행자 동선 시뮬레이션을 역동적인 카메라 워크와 결합하여 고품질의 홍보 영상을 제작했습니다."
        }
    ];

    async function seedFirestoreProjects() {
        console.log("Seeding Firestore with default projects...");
        try {
            for (const proj of SEED_PROJECTS) {
                await addDoc(collection(db, "projects"), proj);
            }
            const slidesRef = doc(db, "hero_slides", "config");
            await setDoc(slidesRef, { slides: SEED_SLIDES });
        } catch (e) {
            console.error("Error seeding Firestore:", e);
        }
    }

    // Compress image helper using HTML5 Canvas to prevent LocalStorage quota limits (max 1200px, 0.7 quality)
    function compressAndLoadImage(file, callback) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 1200;
                const MAX_HEIGHT = 1200;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height = Math.round((height * MAX_WIDTH) / width);
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width = Math.round((width * MAX_HEIGHT) / height);
                        height = MAX_HEIGHT;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // Compress to jpeg with 0.7 quality
                const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
                callback(compressedBase64);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    async function saveSlidesToDB(slidesList) {
        try {
            const slidesRef = doc(db, "hero_slides", "config");
            await setDoc(slidesRef, { slides: slidesList });
        } catch (e) {
            console.error('Firebase save slides failed:', e);
            alert('슬라이드 설정을 파이어베이스에 저장하는 중 오류가 발생했습니다.');
        }
    }


    // --- 3. Dashboard Management Engine ---
    const tableBody = document.getElementById('table-body-projects');
    const btnAddProject = document.getElementById('btn-add-project');
    
    // Overview Metrics selectors
    const statTotal = document.getElementById('stats-total');
    const statBirdsEye = document.getElementById('stats-birds-eye');
    const statPerspective = document.getElementById('stats-perspective');
    const statInterior = document.getElementById('stats-interior');
    const statSimulation = document.getElementById('stats-simulation');
    const summaryCountText = document.getElementById('project-count-summary');

    let tempSlides = []; // Local memory cache for slide edits
    let allProjects = [];

    function initDashboard() {
        if (projectsUnsubscribe) projectsUnsubscribe();
        if (slidesUnsubscribe) slidesUnsubscribe();

        // Listen to projects
        const qProjects = query(collection(db, "projects"), orderBy("id", "asc"));
        projectsUnsubscribe = onSnapshot(qProjects, (snapshot) => {
            allProjects = [];
            snapshot.forEach((doc) => {
                allProjects.push({ docId: doc.id, ...doc.data() });
            });
            
            if (allProjects.length === 0) {
                seedFirestoreProjects();
            } else {
                renderDashboardTable();
                calculateDashboardMetrics();
            }
        }, (error) => {
            console.error("Firestore projects listener failed:", error);
        });

        // Listen to slides
        slidesUnsubscribe = onSnapshot(collection(db, "hero_slides"), (snapshot) => {
            let loadedSlides = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                if (data && data.slides) {
                    loadedSlides = data.slides;
                }
            });
            tempSlides = loadedSlides.length > 0 ? loadedSlides : [...SEED_SLIDES];
            renderSlidesManager();
        }, (error) => {
            console.error("Firestore slides listener failed:", error);
        });
    }

    // Translate category key for CSS class
    function getCategoryClass(categoryKey) {
        return categoryKey;
    }

    // Translate category key for human label
    function getCategoryLabel(categoryKey) {
        switch (categoryKey) {
            case 'birds-eye': return '조감도';
            case 'perspective': return '투시도';
            case 'interior': return '인테리어';
            case 'simulation': return '시뮬레이션';
            default: return '기타';
        }
    }

    function calculateDashboardMetrics() {
        const counts = {
            total: allProjects.length,
            'birds-eye': 0,
            'perspective': 0,
            'interior': 0,
            'simulation': 0
        };

        allProjects.forEach(p => {
            if (counts[p.category] !== undefined) {
                counts[p.category]++;
            }
        });

        // Set values in UI
        if (statTotal) statTotal.textContent = counts.total;
        if (statBirdsEye) statBirdsEye.textContent = counts['birds-eye'];
        if (statPerspective) statPerspective.textContent = counts['perspective'];
        if (statInterior) statInterior.textContent = counts['interior'];
        if (statSimulation) statSimulation.textContent = counts['simulation'];
        if (summaryCountText) summaryCountText.textContent = `(총 ${counts.total}개 등록됨)`;
    }

    function renderDashboardTable() {
        if (!tableBody) return;
        tableBody.innerHTML = '';
        
        if (allProjects.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; color: var(--text-muted); padding: 40px 0;">
                        등록된 프로젝트가 없습니다. '새 프로젝트 추가' 버튼을 눌러 프로젝트를 등록해 주세요.
                    </td>
                </tr>
            `;
            return;
        }

        allProjects.forEach(project => {
            const tr = document.createElement('tr');
            
            tr.innerHTML = `
                <td>
                    <img class="table-thumb" src="${project.imgUrl || 'assets/architectural_cg.png'}" alt="썸네일">
                </td>
                <td style="font-weight: 500; color: var(--text-primary);">${project.title}</td>
                <td>
                    <span class="cat-badge ${getCategoryClass(project.category)}">
                        ${getCategoryLabel(project.category)}
                    </span>
                </td>
                <td style="color: var(--text-muted);">${project.date}</td>
                <td style="text-align: center;">
                    <div class="table-actions" style="justify-content: center;">
                        <button class="table-btn edit-btn" data-id="${project.id}">수정</button>
                        <button class="table-btn delete-btn" data-id="${project.id}">삭제</button>
                    </div>
                </td>
            `;

            // Hook actions
            const editBtn = tr.querySelector('.edit-btn');
            const deleteBtn = tr.querySelector('.delete-btn');

            if (editBtn) {
                editBtn.addEventListener('click', () => {
                    openFormModal(project.id);
                });
            }

            if (deleteBtn) {
                deleteBtn.addEventListener('click', () => {
                    deleteProject(project.id);
                });
            }

            tableBody.appendChild(tr);
        });
    }


    // --- 4. CRUD Modals and Data Flow ---
    const formModal = document.getElementById('project-form-modal');
    const formModalCloseBtn = document.getElementById('form-modal-close-btn');
    const formModalCloseBackdrop = document.getElementById('form-modal-close-backdrop');
    const cancelProjectBtn = document.getElementById('cancel-project-btn');
    
    const projectForm = document.getElementById('portfolio-project-form');
    const formModalTitle = document.getElementById('form-modal-title');
    
    // Form Inputs
    const fId = document.getElementById('form-project-id');
    const fTitle = document.getElementById('form-title');
    const fCategory = document.getElementById('form-category');
    const fDate = document.getElementById('form-date');
    const fImgUrl = document.getElementById('form-img-url');
    const fFileInput = document.getElementById('form-file-input');
    const fileNameDisplay = document.getElementById('file-name-display');
    const fImagePreview = document.getElementById('form-image-preview');
    
    let uploadedImageBase64 = ''; // Cache file reader URL

    function openFormModal(docId = null) {
        if (!formModal) return;
        
        // Reset file values
        uploadedImageBase64 = '';
        if (fileNameDisplay) fileNameDisplay.textContent = '선택된 파일 없음';
        if (fImagePreview) {
            fImagePreview.src = '';
            fImagePreview.style.display = 'none';
        }
        
        if (projectForm) projectForm.reset();
        
        if (docId) {
            // Edit Mode
            formModalTitle.textContent = '프로젝트 정보 수정';
            const project = allProjects.find(p => p.docId === docId);
            
            if (project) {
                fId.value = project.docId;
                fTitle.value = project.title;
                fCategory.value = project.category;
                fDate.value = project.date;
                fImgUrl.value = project.imgUrl;
                
                if (project.imgUrl) {
                    fImagePreview.src = project.imgUrl;
                    fImagePreview.style.display = 'block';
                }
            }
        } else {
            // Add Mode
            formModalTitle.textContent = '새 프로젝트 추가';
            fId.value = '';
        }
        
        formModal.classList.add('active');
        formModal.setAttribute('aria-hidden', 'false');
    }

    function closeFormModal() {
        if (formModal) {
            formModal.classList.remove('active');
            formModal.setAttribute('aria-hidden', 'true');
        }
    }

    if (btnAddProject) {
        btnAddProject.addEventListener('click', () => {
            openFormModal();
        });
    }

    if (formModalCloseBtn) formModalCloseBtn.addEventListener('click', closeFormModal);
    if (formModalCloseBackdrop) formModalCloseBackdrop.addEventListener('click', closeFormModal);
    if (cancelProjectBtn) cancelProjectBtn.addEventListener('click', closeFormModal);

    // File selection event listener with Canvas Compression
    if (fFileInput) {
        fFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                if (fileNameDisplay) fileNameDisplay.textContent = file.name;
                
                compressAndLoadImage(file, (compressedBase64) => {
                    uploadedImageBase64 = compressedBase64;
                    if (fImagePreview) {
                        fImagePreview.src = uploadedImageBase64;
                        fImagePreview.style.display = 'block';
                    }
                    if (fImgUrl) fImgUrl.value = ''; // Reset path input if uploading file
                });
            } else {
                if (fileNameDisplay) fileNameDisplay.textContent = '선택된 파일 없음';
            }
        });
    }

    // Manual typing image URL preview update
    if (fImgUrl) {
        fImgUrl.addEventListener('input', () => {
            const urlVal = fImgUrl.value.trim();
            if (urlVal && fImagePreview) {
                fImagePreview.src = urlVal;
                fImagePreview.style.display = 'block';
                if (fFileInput) fFileInput.value = '';
                if (fileNameDisplay) fileNameDisplay.textContent = '선택된 파일 없음';
                uploadedImageBase64 = '';
            } else if (fImagePreview && !uploadedImageBase64) {
                fImagePreview.src = '';
                fImagePreview.style.display = 'none';
            }
        });
    }

    // Submit Project Form (Create / Update database sync)
    if (projectForm) {
        projectForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const titleVal = fTitle.value.trim();
            const categoryVal = fCategory.value;
            const dateVal = fDate.value.trim();
            
            const saveBtn = document.getElementById('save-project-btn');
            const originalBtnText = saveBtn ? saveBtn.textContent : '저장하기';
            if (saveBtn) {
                saveBtn.disabled = true;
                saveBtn.textContent = '업로드 및 저장 중...';
            }

            try {
                // Image resolve
                let finalImgUrl = fImgUrl.value.trim();
                if (uploadedImageBase64) {
                    const storageRef = ref(storage, `portfolio-images/${Date.now()}_project.jpg`);
                    const uploadSnap = await uploadString(storageRef, uploadedImageBase64, 'data_url');
                    finalImgUrl = await getDownloadURL(uploadSnap.ref);
                }
                
                if (!finalImgUrl) {
                    alert('이미지 경로를 지정하거나 이미지 파일을 업로드해 주세요.');
                    if (saveBtn) {
                        saveBtn.disabled = false;
                        saveBtn.textContent = originalBtnText;
                    }
                    return;
                }
                
                const docIdVal = fId.value;
                
                if (docIdVal) {
                    // Update
                    const docRef = doc(db, "projects", docIdVal);
                    await updateDoc(docRef, {
                        title: titleVal,
                        category: categoryVal,
                        imgUrl: finalImgUrl,
                        date: dateVal
                    });
                } else {
                    // Create
                    const maxId = allProjects.length > 0 ? Math.max(...allProjects.map(p => p.id || 0)) : 0;
                    await addDoc(collection(db, "projects"), {
                        id: maxId + 1,
                        title: titleVal,
                        category: categoryVal,
                        imgUrl: finalImgUrl,
                        software: '',
                        scope: '',
                        date: dateVal,
                        client: '',
                        desc: ''
                    });
                }
                
                closeFormModal();
            } catch (error) {
                console.error("Save project failed:", error);
                alert("프로젝트 저장에 실패했습니다: " + error.message);
            } finally {
                if (saveBtn) {
                    saveBtn.disabled = false;
                    saveBtn.textContent = originalBtnText;
                }
            }
        });
    }


    // --- 5. Hero Slider Management Engine ---
    const slidesGrid = document.getElementById('slides-admin-grid');
    const btnAddSlide = document.getElementById('btn-add-slide');
    const btnSaveSlides = document.getElementById('btn-save-slides');

    function renderSlidesManager() {
        if (!slidesGrid) return;
        slidesGrid.innerHTML = '';

        if (tempSlides.length === 0) {
            slidesGrid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; color: var(--text-muted); padding: 30px 0;">
                    등록된 슬라이드가 없습니다. 우측 상단의 '+ 새 슬라이드 추가' 버튼을 눌러 슬라이드를 추가해 주세요.
                </div>
            `;
            return;
        }

        tempSlides.forEach((slideUrl, index) => {
            const card = document.createElement('div');
            card.className = 'slide-admin-card';
            
            // Render card contents
            card.innerHTML = `
                <button class="delete-btn" title="슬라이드 삭제">&times;</button>
                <div class="slide-admin-thumb-wrapper">
                    <span class="slide-admin-badge">SLIDE ${index + 1}</span>
                    <img class="slide-admin-thumb" src="${slideUrl}" alt="슬라이드 미리보기">
                </div>
                <div class="slide-admin-inputs">
                    <input type="text" class="slide-url-input" value="${slideUrl.startsWith('data:image') || slideUrl.startsWith('http') ? '클라우드 이미지 URL' : slideUrl}" placeholder="이미지 주소 (예: assets/birds_eye_view.png)" ${slideUrl.startsWith('data:image') || slideUrl.startsWith('http') ? 'disabled' : ''}>
                    
                    <div class="slide-file-group">
                        <label class="slide-file-label" for="slide-file-${index}">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="17 8 12 3 7 8"></polyline>
                                <line x1="12" y1="3" x2="12" y2="15"></line>
                            </svg>
                            <span>이미지 파일 업로드</span>
                        </label>
                        <input type="file" id="slide-file-${index}" class="slide-file-input" accept="image/*" style="display: none;">
                    </div>
                </div>
            `;

            // Delete Slide button handler
            const delBtn = card.querySelector('.delete-btn');
            delBtn.addEventListener('click', () => {
                tempSlides.splice(index, 1);
                renderSlidesManager();
            });

            // Manual url textbox input handler
            const urlInput = card.querySelector('.slide-url-input');
            if (urlInput) {
                urlInput.addEventListener('input', () => {
                    tempSlides[index] = urlInput.value.trim();
                    const thumbImg = card.querySelector('.slide-admin-thumb');
                    if (thumbImg) thumbImg.src = tempSlides[index];
                });
            }

            // File upload selector listener with Canvas Compression
            const fileInput = card.querySelector('.slide-file-input');
            if (fileInput) {
                fileInput.addEventListener('change', (e) => {
                    const file = e.target.files[0];
                    if (file) {
                        compressAndLoadImage(file, async (compressedBase64) => {
                            try {
                                const storageRef = ref(storage, `hero-slides/${Date.now()}_slide.jpg`);
                                const uploadSnap = await uploadString(storageRef, compressedBase64, 'data_url');
                                const downloadUrl = await getDownloadURL(uploadSnap.ref);
                                
                                tempSlides[index] = downloadUrl;
                                const thumbImg = card.querySelector('.slide-admin-thumb');
                                if (thumbImg) thumbImg.src = tempSlides[index];
                                if (urlInput) {
                                    urlInput.value = '클라우드 이미지 URL';
                                    urlInput.disabled = true;
                                }
                            } catch (err) {
                                console.error("Slide upload failed:", err);
                                alert("슬라이드 이미지 업로드에 실패했습니다.");
                            }
                        });
                    }
                });
            }

            slidesGrid.appendChild(card);
        });
    }

    if (btnAddSlide) {
        btnAddSlide.addEventListener('click', () => {
            tempSlides.push('assets/architectural_cg.png'); // Add default slide
            renderSlidesManager();
        });
    }

    if (btnSaveSlides) {
        btnSaveSlides.addEventListener('click', async () => {
            await saveSlidesToDB(tempSlides);
            alert('슬라이드 설정이 성공적으로 저장되었습니다. 메인 웹사이트 슬라이더에 동기화되었습니다.');
            window.location.reload();
        });
    }


    // --- Password Change Modal Logic ---
    const passwordModal = document.getElementById('password-change-modal');
    const openPasswordModalBtn = document.getElementById('btn-open-password-modal');
    const closePasswordModalBtn = document.getElementById('password-modal-close-btn');
    const passwordModalBackdrop = document.getElementById('password-modal-close-backdrop');
    const cancelPasswordBtn = document.getElementById('cancel-password-change-btn');
    
    const passwordForm = document.getElementById('admin-password-change-form');
    const pCurrent = document.getElementById('change-current-password');
    const pNew = document.getElementById('change-new-password');
    const pConfirm = document.getElementById('change-confirm-password');
    const pFeedback = document.getElementById('password-change-feedback');

    function openPasswordModal() {
        if (!passwordModal) return;
        if (passwordForm) passwordForm.reset();
        if (pFeedback) pFeedback.textContent = '';
        passwordModal.classList.add('active');
        passwordModal.setAttribute('aria-hidden', 'false');
    }

    function closePasswordModal() {
        if (passwordModal) {
            passwordModal.classList.remove('active');
            passwordModal.setAttribute('aria-hidden', 'true');
        }
    }

    if (openPasswordModalBtn) openPasswordModalBtn.addEventListener('click', openPasswordModal);
    if (closePasswordModalBtn) closePasswordModalBtn.addEventListener('click', closePasswordModal);
    if (passwordModalBackdrop) passwordModalBackdrop.addEventListener('click', closePasswordModal);
    if (cancelPasswordBtn) cancelPasswordBtn.addEventListener('click', closePasswordModal);

    if (passwordForm) {
        passwordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const currentVal = pCurrent.value;
            const newVal = pNew.value;
            const confirmVal = pConfirm.value;
            
            if (pFeedback) {
                pFeedback.textContent = '처리 중...';
                pFeedback.style.color = 'var(--accent)';
            }
            
            const user = auth.currentUser;
            if (!user) {
                if (pFeedback) {
                    pFeedback.textContent = '로그인이 만료되었습니다. 다시 로그인 해 주세요.';
                    pFeedback.style.color = 'hsl(0, 80%, 60%)';
                }
                return;
            }
            
            if (newVal.length < 4) {
                if (pFeedback) {
                    pFeedback.textContent = '새 비밀번호는 4자리 이상이어야 합니다.';
                    pFeedback.style.color = 'hsl(0, 80%, 60%)';
                }
                return;
            }
            
            if (newVal !== confirmVal) {
                if (pFeedback) {
                    pFeedback.textContent = '새 비밀번호가 일치하지 않습니다.';
                    pFeedback.style.color = 'hsl(0, 80%, 60%)';
                }
                return;
            }
            
            try {
                // Re-authenticate before updating password to avoid session timeout errors
                const credential = EmailAuthProvider.credential(user.email, currentVal);
                await reauthenticateWithCredential(user, credential);
                
                // Update password in Auth DB
                await updatePassword(user, newVal);
                
                if (pFeedback) {
                    pFeedback.textContent = '비밀번호가 성공적으로 변경되었습니다. 다시 로그인 해 주세요.';
                    pFeedback.style.color = 'hsl(140, 70%, 50%)';
                }
                
                setTimeout(async () => {
                    closePasswordModal();
                    await signOut(auth);
                    window.location.reload();
                }, 1500);
            } catch (err) {
                console.error("Password update failed:", err);
                if (pFeedback) {
                    if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
                        pFeedback.textContent = '현재 비밀번호가 올바르지 않습니다.';
                    } else {
                        pFeedback.textContent = '비밀번호 변경에 실패했습니다: ' + err.message;
                    }
                    pFeedback.style.color = 'hsl(0, 80%, 60%)';
                }
            }
        });
    }
});
