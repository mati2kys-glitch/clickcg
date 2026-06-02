/* ==========================================================================
   CLICK DESIGN Admin Dashboard Controller Logic (admin.js - GitHub API CMS)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. GitHub Auth Elements & Keys ---
    const loginOverlay = document.getElementById('admin-login-overlay');
    const dashboardView = document.getElementById('admin-dashboard-view');
    const loginForm = document.getElementById('admin-login-form');
    const tokenInput = document.getElementById('github-token-input');
    const repoInput = document.getElementById('github-repo-input');
    const branchInput = document.getElementById('github-branch-input');
    const loginErrorMsg = document.getElementById('login-error-msg');
    const logoutBtn = document.getElementById('admin-logout-btn');

    const STORAGE_TOKEN_KEY = 'click_design_github_token';
    const STORAGE_REPO_KEY = 'click_design_github_repo';
    const STORAGE_BRANCH_KEY = 'click_design_github_branch';

    let githubToken = '';
    let githubRepo = '';
    let githubBranch = 'main';

    let tempProjects = [];
    let tempSlides = [];
    let projectsJsonSha = null; // Essential for GitHub API file update commits

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

    // Check GitHub connection keys in LocalStorage
    function checkLoginSession() {
        githubToken = localStorage.getItem(STORAGE_TOKEN_KEY);
        githubRepo = localStorage.getItem(STORAGE_REPO_KEY);
        githubBranch = localStorage.getItem(STORAGE_BRANCH_KEY) || 'main';

        if (githubToken && githubRepo) {
            if (loginOverlay) loginOverlay.style.display = 'none';
            if (dashboardView) dashboardView.style.display = 'block';
            initDashboard();
        } else {
            if (loginOverlay) loginOverlay.style.display = 'flex';
            if (dashboardView) dashboardView.style.display = 'none';
        }
    }

    // Connect & Login via GitHub API Verification
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const tokenVal = tokenInput.value.trim();
            let repoVal = repoInput.value.trim();
            const branchVal = branchInput.value.trim() || 'main';

            // Automatically parse full GitHub URL if pasted
            if (repoVal.includes('github.com/')) {
                repoVal = repoVal.split('github.com/')[1].split('?')[0].replace(/\.git$/, '');
            }

            if (loginErrorMsg) {
                loginErrorMsg.textContent = 'GitHub API 연결 시도 중...';
                loginErrorMsg.style.color = 'var(--accent)';
            }

            try {
                // Test fetch target file via GitHub API
                const url = `https://api.github.com/repos/${repoVal}/contents/projects.json?ref=${branchVal}`;
                const response = await fetch(url, {
                    headers: {
                        'Authorization': `token ${tokenVal}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                });

                if (response.ok || response.status === 404) {
                    // Valid Token and repository owner/path (404 is allowed since file might not exist yet)
                    localStorage.setItem(STORAGE_TOKEN_KEY, tokenVal);
                    localStorage.setItem(STORAGE_REPO_KEY, repoVal);
                    localStorage.setItem(STORAGE_BRANCH_KEY, branchVal);
                    
                    if (loginErrorMsg) loginErrorMsg.textContent = '';
                    checkLoginSession();
                } else {
                    throw new Error(`연결 실패 (응답코드: ${response.status})`);
                }
            } catch (err) {
                console.error("GitHub API Login Auth Failed:", err);
                if (loginErrorMsg) {
                    loginErrorMsg.textContent = '연결에 실패했습니다. 토큰 비밀키 또는 저장소 주소가 올바른지 확인해 주세요.';
                    loginErrorMsg.style.color = 'hsl(0, 80%, 60%)';
                }
            }
        });
    }

    // Logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (confirm('저장소 연동을 해제하고 로그아웃 하시겠습니까?')) {
                localStorage.removeItem(STORAGE_TOKEN_KEY);
                localStorage.removeItem(STORAGE_REPO_KEY);
                localStorage.removeItem(STORAGE_BRANCH_KEY);
                window.location.reload();
            }
        });
    }


    // --- 2. GitHub Contents API Database Synchronization ---

    // Decode Unicode safely from Base64
    function b64DecodeUnicode(str) {
        return decodeURIComponent(atob(str).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
    }

    // Encode Unicode safely to Base64
    function b64EncodeUnicode(str) {
        return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function(match, p1) {
            return String.fromCharCode(parseInt(p1, 16));
        }));
    }

    async function loadStaticDatabase() {
        if (!githubToken || !githubRepo) return;
        
        try {
            const url = `https://api.github.com/repos/${githubRepo}/contents/projects.json?ref=${githubBranch}`;
            const response = await fetch(url, {
                headers: {
                    'Authorization': `token ${githubToken}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                projectsJsonSha = data.sha; // Save SHA value for next commit writes
                
                const parsedContent = JSON.parse(b64DecodeUnicode(data.content));
                tempProjects = parsedContent.projects || [];
                tempSlides = parsedContent.slides || [];
            } else if (response.status === 404) {
                // If projects.json doesn't exist, seed local memory defaults
                console.log("projects.json not found on GitHub. Seeding local memory...");
                tempProjects = SEED_PROJECTS;
                tempSlides = SEED_SLIDES;
                projectsJsonSha = null; // No SHA yet
            } else {
                throw new Error("HTTP error " + response.status);
            }
        } catch (error) {
            console.error("GitHub API Database load failed:", error);
            alert("깃허브 저장소에서 포트폴리오 데이터를 불러오지 못했습니다. 로컬 디폴트 시드를 사용합니다.");
            tempProjects = SEED_PROJECTS;
            tempSlides = SEED_SLIDES;
        }
    }

    function getProjectsFromDB() {
        return tempProjects;
    }

    function getSlidesFromDB() {
        return tempSlides;
    }

    // Commit projects.json modifications back to GitHub
    async function commitJsonDatabaseToGithub() {
        if (!githubToken || !githubRepo) return;

        const dataToSave = {
            slides: tempSlides,
            projects: tempProjects
        };

        const jsonString = JSON.stringify(dataToSave, null, 2);
        const base64Content = b64EncodeUnicode(jsonString);

        try {
            // Re-fetch current SHA first to prevent merge conflicts
            const checkUrl = `https://api.github.com/repos/${githubRepo}/contents/projects.json?ref=${githubBranch}`;
            const checkRes = await fetch(checkUrl, {
                headers: {
                    'Authorization': `token ${githubToken}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            if (checkRes.ok) {
                const checkData = await checkRes.json();
                projectsJsonSha = checkData.sha;
            }

            const writeUrl = `https://api.github.com/repos/${githubRepo}/contents/projects.json`;
            const payload = {
                message: 'Update projects.json database via CLICK DESIGN G-CMS',
                content: base64Content,
                branch: githubBranch
            };
            if (projectsJsonSha) {
                payload.sha = projectsJsonSha;
            }

            const response = await fetch(writeUrl, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${githubToken}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/vnd.github.v3+json'
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const responseData = await response.json();
                projectsJsonSha = responseData.content.sha; // Update current sha
                console.log("Successfully committed projects.json updates to GitHub.");
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP ${response.status}`);
            }
        } catch (e) {
            console.error("GitHub Commit Failed:", e);
            throw new Error(`깃허브에 데이터를 기록하지 못했습니다: ${e.message}`);
        }
    }

    // Upload optimized base64 image data directly to GitHub assets/ directory
    async function uploadImageToGithub(base64String, fileName) {
        if (!githubToken || !githubRepo) return base64String;

        try {
            // Strip headers from Base64 Data URL (e.g. data:image/jpeg;base64,xxxx)
            const cleanBase64 = base64String.split(',')[1];
            const cleanFileName = fileName.replace(/\s+/g, '_'); // Replace spaces
            const path = `assets/project_${Date.now()}_${cleanFileName}`;
            const url = `https://api.github.com/repos/${githubRepo}/contents/${path}`;

            const payload = {
                message: `Upload asset ${cleanFileName} via CLICK DESIGN G-CMS`,
                content: cleanBase64,
                branch: githubBranch
            };

            const response = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${githubToken}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/vnd.github.v3+json'
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                console.log(`Uploaded image asset successfully: ${path}`);
                return path; // Store relative path in database for compatibility
            } else {
                const errData = await response.json();
                throw new Error(errData.message || `HTTP ${response.status}`);
            }
        } catch (err) {
            console.error("GitHub Asset upload error:", err);
            throw new Error(`이미지 파일을 깃허브에 업로드하지 못했습니다: ${err.message}`);
        }
    }

    // Compress helper (max 1200px, 0.7 quality)
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

                const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
                callback(compressedBase64);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
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

    async function initDashboard() {
        await loadStaticDatabase();
        renderDashboardTable();
        calculateDashboardMetrics();
        initSlidesDashboard();
    }

    function initSlidesDashboard() {
        tempSlides = [...getSlidesFromDB()];
        renderSlidesManager();
    }

    function getCategoryClass(categoryKey) {
        return categoryKey;
    }

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
                    <td colspan="5" style="text-align: center; color: var(--text-muted); padding: 40px 0;">
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
    const saveProjectFormBtn = document.getElementById('save-project-btn');
    
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
    
    let uploadedImageBase64 = ''; 
    let uploadedFileName = '';

    function openFormModal(id = null) {
        if (!formModal) return;
        
        uploadedImageBase64 = '';
        uploadedFileName = '';
        if (fileNameDisplay) fileNameDisplay.textContent = '선택된 파일 없음';
        if (fImagePreview) {
            fImagePreview.src = '';
            fImagePreview.style.display = 'none';
        }
        
        if (projectForm) projectForm.reset();
        
        if (id) {
            formModalTitle.textContent = '프로젝트 정보 수정';
            const projects = getProjectsFromDB();
            const project = projects.find(p => String(p.id) === String(id));
            
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

    if (fFileInput) {
        fFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                if (fileNameDisplay) fileNameDisplay.textContent = file.name;
                uploadedFileName = file.name;
                
                compressAndLoadImage(file, (compressedBase64) => {
                    uploadedImageBase64 = compressedBase64;
                    if (fImagePreview) {
                        fImagePreview.src = uploadedImageBase64;
                        fImagePreview.style.display = 'block';
                    }
                    if (fImgUrl) fImgUrl.value = ''; 
                });
            } else {
                if (fileNameDisplay) fileNameDisplay.textContent = '선택된 파일 없음';
            }
        });
    }

    if (fImgUrl) {
        fImgUrl.addEventListener('input', () => {
            const urlVal = fImgUrl.value.trim();
            if (urlVal && fImagePreview) {
                fImagePreview.src = urlVal;
                fImagePreview.style.display = 'block';
                if (fFileInput) fFileInput.value = '';
                if (fileNameDisplay) fileNameDisplay.textContent = '선택된 파일 없음';
                uploadedImageBase64 = '';
                uploadedFileName = '';
            } else if (fImagePreview && !uploadedImageBase64) {
                fImagePreview.src = '';
                fImagePreview.style.display = 'none';
            }
        });
    }

    // Submit Project Form (Create / Update)
    if (projectForm) {
        projectForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const titleVal = fTitle.value.trim();
            const categoryVal = fCategory.value;
            const dateVal = fDate.value.trim();
            let finalImgUrl = fImgUrl.value.trim();

            if (!finalImgUrl && !uploadedImageBase64) {
                alert('이미지 경로를 지정하거나 이미지 파일을 업로드해 주세요.');
                return;
            }

            if (saveProjectFormBtn) {
                saveProjectFormBtn.textContent = '저장 중...';
                saveProjectFormBtn.disabled = true;
            }
            
            const projects = getProjectsFromDB();
            const editId = fId.value ? fId.value : null;

            try {
                // 1. Upload new image asset to GitHub if selected via file input
                if (uploadedImageBase64) {
                    finalImgUrl = await uploadImageToGithub(uploadedImageBase64, uploadedFileName || 'portfolio.jpg');
                }

                // 2. Modify temporary dataset array
                if (editId) {
                    const editNumericId = parseInt(editId);
                    const index = projects.findIndex(p => p.id === editNumericId);
                    if (index !== -1) {
                        projects[index] = {
                            id: editNumericId,
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
                    const maxId = projects.length > 0 ? Math.max(...projects.map(p => p.id)) : 0;
                    projects.push({
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
                
                tempProjects = projects;

                // 3. Commit updated projects.json back to GitHub
                await commitJsonDatabaseToGithub();

                alert("성공적으로 업로드 및 저장되었습니다! 1분 내외로 깃허브 웹사이트에 적용됩니다.");
                closeFormModal();
                await initDashboard();
            } catch (err) {
                console.error("Save failure:", err);
                alert("저장 및 깃허브 전송 실패: " + err.message);
            } finally {
                if (saveProjectFormBtn) {
                    saveProjectFormBtn.textContent = '저장하기';
                    saveProjectFormBtn.disabled = false;
                }
            }
        });
    }

    // Delete Project
    async function deleteProject(id) {
        const projects = getProjectsFromDB();
        const project = projects.find(p => String(p.id) === String(id));
        
        if (project) {
            const confirmed = confirm(`"${project.title}" 프로젝트를 정말로 삭제하시겠습니까?`);
            if (confirmed) {
                try {
                    // Update dataset by filtering out target id
                    tempProjects = projects.filter(p => String(p.id) !== String(id));
                    
                    // Commit projects.json back to GitHub
                    await commitJsonDatabaseToGithub();
                    
                    alert("프로젝트가 삭제되었습니다. 깃허브 웹사이트에 반영까지 약 1분이 소요됩니다.");
                    await initDashboard();
                } catch (e) {
                    console.error("Delete Failed:", e);
                    alert("삭제 중 에러가 발생했습니다: " + e.message);
                }
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
            
            card.innerHTML = `
                <button class="delete-btn" title="슬라이드 삭제">&times;</button>
                <div class="slide-admin-thumb-wrapper">
                    <span class="slide-admin-badge">SLIDE ${index + 1}</span>
                    <img class="slide-admin-thumb" src="${slideUrl}" alt="슬라이드 미리보기">
                </div>
                <div class="slide-admin-inputs">
                    <input type="text" class="slide-url-input" value="${slideUrl.startsWith('data:image') || slideUrl.startsWith('assets/slide_') ? '업로드된 파일 이미지' : slideUrl}" placeholder="이미지 주소 (예: assets/birds_eye_view.png)" ${slideUrl.startsWith('data:image') || slideUrl.startsWith('assets/slide_') ? 'disabled' : ''}>
                    
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

            // Delete Slide
            const delBtn = card.querySelector('.delete-btn');
            delBtn.addEventListener('click', () => {
                tempSlides.splice(index, 1);
                renderSlidesManager();
            });

            // Manual URL input
            const urlInput = card.querySelector('.slide-url-input');
            if (urlInput) {
                urlInput.addEventListener('input', () => {
                    tempSlides[index] = urlInput.value.trim();
                    const thumbImg = card.querySelector('.slide-admin-thumb');
                    if (thumbImg) thumbImg.src = tempSlides[index];
                });
            }

            // File Upload for Slide Card
            const fileInput = card.querySelector('.slide-file-input');
            if (fileInput) {
                fileInput.addEventListener('change', (e) => {
                    const file = e.target.files[0];
                    if (file) {
                        const loadingLabel = card.querySelector('.slide-file-label span');
                        if (loadingLabel) loadingLabel.textContent = "압축 중...";
                        
                        compressAndLoadImage(file, async (compressedBase64) => {
                            if (loadingLabel) loadingLabel.textContent = "업로드 중...";
                            
                            try {
                                const newPath = await uploadImageToGithub(compressedBase64, `slide_${index}_${file.name}`);
                                tempSlides[index] = newPath;
                                
                                const thumbImg = card.querySelector('.slide-admin-thumb');
                                if (thumbImg) thumbImg.src = tempSlides[index];
                                if (urlInput) {
                                    urlInput.value = '업로드된 파일 이미지';
                                    urlInput.disabled = true;
                                }
                                if (loadingLabel) loadingLabel.textContent = "업로드 완료";
                            } catch (uploadErr) {
                                alert("슬라이드 깃허브 업로드 실패: " + uploadErr.message);
                                if (loadingLabel) loadingLabel.textContent = "이미지 파일 업로드";
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
            tempSlides.push('assets/architectural_cg.png'); 
            renderSlidesManager();
        });
    }

    if (btnSaveSlides) {
        btnSaveSlides.addEventListener('click', async () => {
            btnSaveSlides.textContent = '저장 중...';
            btnSaveSlides.disabled = true;
            try {
                // Commit slide changes back to projects.json on GitHub
                await commitJsonDatabaseToGithub();
                alert('슬라이더 설정이 성공적으로 저장되었습니다! 1분 내외로 깃허브 웹사이트에 적용됩니다.');
                window.location.reload();
            } catch (err) {
                alert("슬라이더 저장 실패: " + err.message);
            } finally {
                btnSaveSlides.textContent = '슬라이드 설정 저장';
                btnSaveSlides.disabled = false;
            }
        });
    }


    // --- 6. Bootstrapper ---
    checkLoginSession();
});
