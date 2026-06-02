/* ==========================================================================
   CLICK DESIGN Admin Dashboard Controller Logic (admin.js)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. Password Verification and Session State ---
    const loginOverlay = document.getElementById('admin-login-overlay');
    const dashboardView = document.getElementById('admin-dashboard-view');
    const loginForm = document.getElementById('admin-login-form');
    const passwordInput = document.getElementById('admin-password-input');
    const loginErrorMsg = document.getElementById('login-error-msg');
    const logoutBtn = document.getElementById('admin-logout-btn');

    const SESSION_KEY = 'click_design_admin_logged_in';
    const PWD_HASH_KEY = 'click_design_admin_password_hash';
    const DEFAULT_PWD_PLAIN = 'admin1234';

    // Asynchronous SHA-256 hash helper function
    async function sha256(message) {
        const msgBuffer = new TextEncoder().encode(message);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
    }

    async function getAdminPasswordHash() {
        let storedHash = localStorage.getItem(PWD_HASH_KEY);
        if (!storedHash) {
            storedHash = await sha256(DEFAULT_PWD_PLAIN);
            localStorage.setItem(PWD_HASH_KEY, storedHash);
        }
        return storedHash;
    }

    function checkLoginSession() {
        if (sessionStorage.getItem(SESSION_KEY) === 'true') {
            if (loginOverlay) loginOverlay.style.display = 'none';
            if (dashboardView) dashboardView.style.display = 'block';
            initDashboard();
        } else {
            if (loginOverlay) loginOverlay.style.display = 'flex';
            if (dashboardView) dashboardView.style.display = 'none';
        }
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const inputPass = passwordInput.value;
            const hashedInput = await sha256(inputPass);
            const currentHash = await getAdminPasswordHash();
            
            if (hashedInput === currentHash) {
                sessionStorage.setItem(SESSION_KEY, 'true');
                if (loginErrorMsg) loginErrorMsg.textContent = '';
                
                // Transition views
                if (loginOverlay) loginOverlay.style.display = 'none';
                if (dashboardView) dashboardView.style.display = 'block';
                
                initDashboard();
            } else {
                if (loginErrorMsg) {
                    loginErrorMsg.textContent = '비밀번호가 올바르지 않습니다. 다시 입력해 주세요.';
                }
                passwordInput.value = '';
                passwordInput.focus();
            }
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            sessionStorage.removeItem(SESSION_KEY);
            window.location.reload();
        });
    }


    // --- 2. LocalStorage Database Synchronization ---
    const DB_KEY = 'click_design_projects';
    const SLIDES_DB_KEY = 'click_design_hero_slides';

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

    function initDatabase() {
        if (!localStorage.getItem(DB_KEY)) {
            localStorage.setItem(DB_KEY, JSON.stringify(SEED_PROJECTS));
        } else {
            // Migration: Convert category 'cg' to 'interior' for existing stored database items
            const projects = JSON.parse(localStorage.getItem(DB_KEY));
            let migrated = false;
            projects.forEach(p => {
                if (p.category === 'cg') {
                    p.category = 'interior';
                    migrated = true;
                }
            });
            if (migrated) {
                localStorage.setItem(DB_KEY, JSON.stringify(projects));
            }
        }
    }

    function initSlidesDatabase() {
        if (!localStorage.getItem(SLIDES_DB_KEY)) {
            localStorage.setItem(SLIDES_DB_KEY, JSON.stringify(SEED_SLIDES));
        }
    }
    
    function getProjectsFromDB() {
        initDatabase();
        return JSON.parse(localStorage.getItem(DB_KEY));
    }

    function getSlidesFromDB() {
        initSlidesDatabase();
        return JSON.parse(localStorage.getItem(SLIDES_DB_KEY));
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

    function saveProjectsToDB(projectsList) {
        try {
            localStorage.setItem(DB_KEY, JSON.stringify(projectsList));
        } catch (e) {
            console.error('LocalStorage write failed:', e);
            alert('저장 공간(LocalStorage)의 용량이 부족하여 저장을 완료하지 못했습니다. 더 적은 수의 이미지나 저용량 이미지 파일을 사용해 주세요.');
        }
    }

    function saveSlidesToDB(slidesList) {
        try {
            localStorage.setItem(SLIDES_DB_KEY, JSON.stringify(slidesList));
        } catch (e) {
            console.error('LocalStorage write failed:', e);
            alert('저장 공간(LocalStorage)의 용량이 부족하여 슬라이더 설정을 저장하지 못했습니다. 더 작거나 해상도가 낮은 이미지를 업로드해 주세요.');
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

    function initDashboard() {
        renderDashboardTable();
        calculateDashboardMetrics();
        initSlidesDashboard();
    }

    function initSlidesDashboard() {
        tempSlides = [...getSlidesFromDB()];
        renderSlidesManager();
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
        const projects = getProjectsFromDB();
        
        const counts = {
            total: projects.length,
            'birds-eye': 0,
            'perspective': 0,
            'interior': 0,
            'simulation': 0
        };

        projects.forEach(p => {
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
        
        const projects = getProjectsFromDB();
        
        if (projects.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 40px 0;">
                        등록된 프로젝트가 없습니다. '새 프로젝트 추가' 버튼을 눌러 프로젝트를 등록해 주세요.
                    </td>
                </tr>
            `;
            return;
        }

        projects.forEach(project => {
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

    function openFormModal(id = null) {
        if (!formModal) return;
        
        // Reset file values
        uploadedImageBase64 = '';
        if (fileNameDisplay) fileNameDisplay.textContent = '선택된 파일 없음';
        if (fImagePreview) {
            fImagePreview.src = '';
            fImagePreview.style.display = 'none';
        }
        
        if (projectForm) projectForm.reset();
        
        if (id) {
            // Edit Mode
            formModalTitle.textContent = '프로젝트 정보 수정';
            const projects = getProjectsFromDB();
            const project = projects.find(p => p.id === id);
            
            if (project) {
                fId.value = project.id;
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
        projectForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const titleVal = fTitle.value.trim();
            const categoryVal = fCategory.value;
            const dateVal = fDate.value.trim();
            
            // Image resolve
            let finalImgUrl = fImgUrl.value.trim();
            if (uploadedImageBase64) {
                finalImgUrl = uploadedImageBase64;
            }
            
            if (!finalImgUrl) {
                alert('이미지 경로를 지정하거나 이미지 파일을 업로드해 주세요.');
                return;
            }
            
            const projects = getProjectsFromDB();
            const editId = fId.value ? parseInt(fId.value) : null;
            
            if (editId) {
                // Update
                const index = projects.findIndex(p => p.id === editId);
                if (index !== -1) {
                    projects[index] = {
                        id: editId,
                        title: titleVal,
                        category: categoryVal,
                        imgUrl: finalImgUrl,
                        software: '',
                        scope: '',
                        date: dateVal,
                        client: '',
                        desc: ''
                    };
                }
            } else {
                // Create
                const maxId = projects.length > 0 ? Math.max(...projects.map(p => p.id)) : 0;
                const newProject = {
                    id: maxId + 1,
                    title: titleVal,
                    category: categoryVal,
                    imgUrl: finalImgUrl,
                    software: '',
                    scope: '',
                    date: dateVal,
                    client: '',
                    desc: ''
                };
                projects.push(newProject);
            }
            
            saveProjectsToDB(projects);
            closeFormModal();
            initDashboard();
        });
    }

    // Delete project with confirm warning box
    function deleteProject(id) {
        const projects = getProjectsFromDB();
        const project = projects.find(p => p.id === id);
        
        if (project) {
            const confirmed = confirm(`"${project.title}" 프로젝트를 정말로 삭제하시겠습니까?`);
            if (confirmed) {
                const filtered = projects.filter(p => p.id !== id);
                saveProjectsToDB(filtered);
                initDashboard();
            }
        }
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
                    <input type="text" class="slide-url-input" value="${slideUrl.startsWith('data:image') ? 'Base64 이미지 데이터' : slideUrl}" placeholder="이미지 주소 (예: assets/birds_eye_view.png)" ${slideUrl.startsWith('data:image') ? 'disabled' : ''}>
                    
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
                        compressAndLoadImage(file, (compressedBase64) => {
                            tempSlides[index] = compressedBase64;
                            const thumbImg = card.querySelector('.slide-admin-thumb');
                            if (thumbImg) thumbImg.src = tempSlides[index];
                            if (urlInput) {
                                urlInput.value = 'Base64 이미지 데이터';
                                urlInput.disabled = true;
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
        btnSaveSlides.addEventListener('click', () => {
            saveSlidesToDB(tempSlides);
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
            
            const currentHash = await getAdminPasswordHash();
            const inputCurrentHash = await sha256(currentVal);
            
            if (inputCurrentHash !== currentHash) {
                if (pFeedback) {
                    pFeedback.textContent = '현재 비밀번호가 일치하지 않습니다.';
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
            
            // Hash and Save
            const newHash = await sha256(newVal);
            localStorage.setItem(PWD_HASH_KEY, newHash);
            
            if (pFeedback) {
                pFeedback.textContent = '비밀번호가 변경되었습니다. 다시 로그인 해 주세요.';
                pFeedback.style.color = 'hsl(140, 70%, 50%)';
            }
            
            setTimeout(() => {
                closePasswordModal();
                // Logout and force login state refresh
                sessionStorage.removeItem(SESSION_KEY);
                window.location.reload();
            }, 1500);
        });
    }


    // --- 6. Bootstrapper ---
    checkLoginSession();
});
