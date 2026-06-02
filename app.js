/* ==========================================================================
   CLICK DESIGN Main JavaScript Core Logic (User Front-End Only)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. Custom Cursor Logic (with LERP for smooth followers) ---
    const cursor = document.getElementById('custom-cursor');
    const follower = document.getElementById('custom-cursor-follower');
    
    let mouseX = 0, mouseY = 0; // Current mouse coordinates
    let cursorX = 0, cursorY = 0; // Inner dot coordinates
    let followerX = 0, followerY = 0; // Outer circle coordinates
    
    // Mouse movement listener
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    // LERP loop for smooth cursor animation
    function animateCursor() {
        // Fast tracking for inner dot
        cursorX += (mouseX - cursorX) * 0.35;
        cursorY += (mouseY - cursorY) * 0.35;
        
        // Slower tracking for outer circle (LERP factor 0.12)
        followerX += (mouseX - followerX) * 0.12;
        followerY += (mouseY - followerY) * 0.12;
        
        if (cursor) {
            cursor.style.left = `${cursorX}px`;
            cursor.style.top = `${cursorY}px`;
        }
        if (follower) {
            follower.style.left = `${followerX}px`;
            follower.style.top = `${followerY}px`;
        }
        
        requestAnimationFrame(animateCursor);
    }
    animateCursor();

    // Event delegation for cursor hovering effect on interactive elements
    document.addEventListener('mouseover', (e) => {
        const target = e.target.closest('a, button, .filter-btn, .portfolio-card, .dot, select, input, textarea, .file-label-btn');
        if (target) {
            document.body.classList.add('hovering-link');
        }
    });
    
    document.addEventListener('mouseout', (e) => {
        const target = e.target.closest('a, button, .filter-btn, .portfolio-card, .dot, select, input, textarea, .file-label-btn');
        if (target) {
            document.body.classList.remove('hovering-link');
        }
    });


    // --- 2. GNB Scroll Header Background ---
    const header = document.getElementById('main-header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });


    // --- 3. Intersection Observer for Active GNB Track ---
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav-link');
    const observerOptions = {
        root: null,
        rootMargin: '-30% 0px -40% 0px', // Trigger when section occupies the central part of viewport
        threshold: 0
    };
    
    const activeSectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('id');
                navLinks.forEach(link => {
                    if (link.getAttribute('href') === `#${id}`) {
                        link.classList.add('active');
                    } else {
                        link.classList.remove('active');
                    }
                });
            }
        });
    }, observerOptions);
    
    sections.forEach(section => activeSectionObserver.observe(section));


    // --- 4. Mobile Navigation Menu Toggle ---
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const navMenu = document.getElementById('nav-menu');
    
    if (mobileMenuToggle && navMenu) {
        mobileMenuToggle.addEventListener('click', () => {
            mobileMenuToggle.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
        
        // Close menu when navigation link is clicked
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                mobileMenuToggle.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });
    }


    // --- 5. Hero Background Slideshow Slider (Dynamic) ---
    let currentSlideIndex = 0;
    let slideInterval;
    let slides = [];
    let dots = [];
    
    function renderHeroSlider() {
        const sliderWrapper = document.getElementById('hero-bg-slider');
        const dotsWrapper = document.getElementById('hero-slider-dots');
        
        if (!sliderWrapper || !dotsWrapper) return;
        
        sliderWrapper.innerHTML = '';
        dotsWrapper.innerHTML = '';
        
        const heroSlides = getSlidesFromDB();
        
        heroSlides.forEach((slideUrl, index) => {
            // Create slide div
            const slideDiv = document.createElement('div');
            slideDiv.className = index === 0 ? 'slide active' : 'slide';
            slideDiv.style.backgroundImage = `linear-gradient(rgba(10, 10, 10, 0.4), rgba(10, 10, 10, 0.8)), url('${slideUrl}')`;
            sliderWrapper.appendChild(slideDiv);
            
            // Create dot span
            const dotSpan = document.createElement('span');
            dotSpan.className = index === 0 ? 'dot active' : 'dot';
            dotSpan.setAttribute('data-index', index);
            
            // Manual dot navigation
            dotSpan.addEventListener('click', () => {
                showSlide(index);
                startSlideShow(); // Reset autoplay timer
            });
            
            dotsWrapper.appendChild(dotSpan);
        });
        
        // Re-query list elements
        slides = document.querySelectorAll('.hero-bg-slider .slide');
        dots = document.querySelectorAll('.hero-slider-dots .dot');
        
        currentSlideIndex = 0;
        if (slides.length > 0) {
            startSlideShow();
        }
    }
    
    function showSlide(index) {
        if (slides.length === 0) return;
        slides.forEach(slide => slide.classList.remove('active'));
        dots.forEach(dot => dot.classList.remove('active'));
        
        slides[index].classList.add('active');
        dots[index].classList.add('active');
        currentSlideIndex = index;
    }
    
    function nextSlide() {
        if (slides.length === 0) return;
        let nextIndex = (currentSlideIndex + 1) % slides.length;
        showSlide(nextIndex);
    }
    
    function startSlideShow() {
        stopSlideShow();
        slideInterval = setInterval(nextSlide, 5000);
    }
    
    function stopSlideShow() {
        if (slideInterval) {
            clearInterval(slideInterval);
        }
    }


    // --- 6. Scroll Reveal Animation ---
    const revealElements = document.querySelectorAll('.scroll-reveal');
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, {
        root: null,
        threshold: 0.1
    });
    
    revealElements.forEach(el => revealObserver.observe(el));


    // --- 7. Static JSON Database Loader (projects.json) ---
    let cachedProjects = [];
    let cachedSlides = [];
    
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

    // --- 7-1. GitHub Repository 설정 (로컬 환경 테스트 시 깃허브 실시간 동기화 지원) ---
    const GITHUB_CONFIG = {
        owner: "mati2kys-glitch",  // 본인의 깃허브 ID
        repo: "clickcg"            // 본인의 깃허브 저장소명
    };

    async function loadStaticDatabase() {
        let githubUser = "";
        let githubRepo = "";
        
        // 1. 도메인에서 GitHub 사용자 및 레포 자동 감지
        if (window.location.hostname.includes("github.io")) {
            githubUser = window.location.hostname.split('.')[0];
            // pathname에서 레포지토리 이름 추출 (확장자가 있는 파일명 등은 제외)
            const pathSegments = window.location.pathname.split('/').filter(s => {
                return s && !s.includes('.') && s.toLowerCase() !== 'index.html';
            });
            if (pathSegments.length > 0) {
                githubRepo = pathSegments[0];
            } else {
                // 경로 세그먼트가 비어있다면, 깃허브 User Page 레포(예: username.github.io)로 설정
                githubRepo = `${githubUser}.github.io`;
            }
        } else {
            // 로컬 테스트 환경(file:// 등)일 경우, GITHUB_CONFIG에 정의된 원격 저장소 데이터를 끌어옴
            githubUser = GITHUB_CONFIG.owner;
            githubRepo = GITHUB_CONFIG.repo;
        }
        
        // 2. GitHub Pages 환경 또는 지정된 레포가 있을 때 API를 이용해 assets/ 폴더 목록 조회 및 파싱
        if (githubUser && githubRepo) {
            try {
                // 캐시 킬러(?t=타임스탬프)를 추가하여 새로고침 시 깃허브 및 브라우저 API 캐싱을 강제 무력화(실시간 갱신)
                const apiURL = `https://api.github.com/repos/${githubUser}/${githubRepo}/contents/assets?t=${Date.now()}`;
                const response = await fetch(apiURL);
                if (!response.ok) {
                    throw new Error('GitHub API 응답 실패');
                }
                const files = await response.json();
                
                const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
                const projectList = [];
                const slideList = [];
                let pId = 1;
                
                // 파일 이름 기준으로 정렬 (숫자가 있을 때 자연 정렬: slide__2, slide__10 순서 보장)
                files.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
                
                files.forEach(file => {
                    const fileName = file.name;
                    const lowerName = fileName.toLowerCase();
                    const hasImageExt = imageExtensions.some(ext => lowerName.endsWith(ext));
                    
                    if (file.type === 'file' && hasImageExt) {
                        // 메인 슬라이더 이미지인 경우: slide__[순서]__[슬라이드제목]
                        if (lowerName.startsWith('slide__')) {
                            slideList.push(`assets/${fileName}`);
                        } 
                        // 일반 프로젝트 이미지인 경우: [카테고리]__[제작연월]__[프로젝트명]
                        else if (fileName.includes('__')) {
                            const extIndex = fileName.lastIndexOf('.');
                            const cleanName = extIndex !== -1 ? fileName.substring(0, extIndex) : fileName;
                            const parts = cleanName.split('__');
                            
                            if (parts.length >= 3) {
                                let category = parts[0].toLowerCase();
                                const date = parts[1];
                                // 제목 부분에 혹시나 언더바 2개(__)가 추가로 들어가 있어도 온전하게 합쳐 복원
                                const title = parts.slice(2).join('__');
                                
                                // 카테고리 유효성 검사 (오타 방지 fallback)
                                const validCategories = ['birds-eye', 'perspective', 'interior', 'simulation'];
                                if (!validCategories.includes(category)) {
                                    category = 'interior'; // 유효하지 않은 카테고리는 기본값 'interior'로 보정
                                }
                                
                                projectList.push({
                                    id: pId++,
                                    title: title,
                                    category: category, 
                                    imgUrl: `assets/${fileName}`,
                                    software: "",
                                    scope: "",
                                    date: date,
                                    client: "",
                                    desc: ""
                                });
                            }
                        }
                    }
                });
                
                // 파싱 데이터 적용 (데이터가 있을 때만 덮어쓰기)
                if (slideList.length > 0) {
                    cachedSlides = slideList;
                } else {
                    cachedSlides = SEED_SLIDES;
                }
                
                if (projectList.length > 0) {
                    cachedProjects = projectList;
                } else {
                    cachedProjects = SEED_PROJECTS;
                }
                
                console.log('GitHub API 파일명 자동 파싱 완료:', {
                    projects: cachedProjects,
                    slides: cachedSlides
                });
                return; // 성공했으므로 리턴
            } catch (error) {
                console.warn('GitHub API 조회 실패. 로컬 projects.json으로 대체합니다:', error);
            }
        }
        
        // 3. 로컬 테스트 환경이거나 API 실패 시 Fallback: projects.json 로드
        try {
            const response = await fetch('projects.json');
            if (!response.ok) {
                throw new Error('데이터 파일을 불러오는 데 실패했습니다.');
            }
            const data = await response.json();
            cachedProjects = data.projects || [];
            cachedSlides = data.slides || [];
            cachedProjects.sort((a, b) => Number(a.id || 0) - Number(b.id || 0));
            console.log('로컬 projects.json 데이터를 성공적으로 불러왔습니다.');
        } catch (error) {
            console.warn('projects.json 로드 실패. 기본 시드 데이터를 사용합니다:', error);
            cachedProjects = SEED_PROJECTS;
            cachedSlides = SEED_SLIDES;
        }
    }

    function getProjectsFromDB() {
        return cachedProjects;
    }

    function getSlidesFromDB() {
        return cachedSlides;
    }


    // --- 8. Portfolio Rendering & Filtering ---
    let currentFilter = 'all';
    
    const portfolioGrid = document.getElementById('portfolio-grid');
    const categoryFilters = document.querySelectorAll('.filter-btn');
    
    // Category Tabs Filtering
    categoryFilters.forEach(btn => {
        btn.addEventListener('click', () => {
            categoryFilters.forEach(f => f.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.getAttribute('data-filter');
            renderPortfolio();
        });
    });

    // Dynamic Portfolio Render Loop
    function renderPortfolio() {
        if (!portfolioGrid) return;
        
        portfolioGrid.innerHTML = '';
        const allProjects = getProjectsFromDB();
        
        // Filter projects
        const filteredProjects = allProjects.filter(p => currentFilter === 'all' || p.category === currentFilter);
        
        // Render Project Cards
        filteredProjects.forEach(project => {
            const item = document.createElement('div');
            item.className = 'portfolio-item';
            item.setAttribute('data-category', project.category);
            
            item.innerHTML = `
                <div class="portfolio-card">
                    <div class="card-img-wrapper">
                        <img src="${project.imgUrl || 'assets/architectural_cg.png'}" alt="${project.title}">
                    </div>
                </div>
            `;
            
            item.addEventListener('click', () => {
                openDetailModal(project);
            });
            
            portfolioGrid.appendChild(item);
        });
    }


    // --- 9. Project Detail Lightbox Modal Binding ---
    const detailModal = document.getElementById('project-detail-modal');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const modalCloseBackdrop = document.getElementById('modal-close-backdrop');
    const mImg = document.getElementById('modal-project-img');
    
    function openDetailModal(project) {
        if (!detailModal) return;
        
        mImg.src = project.imgUrl || 'assets/architectural_cg.png';
        mImg.alt = project.title;
        
        detailModal.classList.add('active');
        detailModal.setAttribute('aria-hidden', 'false');
    }
    
    function closeDetailModal() {
        if (detailModal) {
            detailModal.classList.remove('active');
            detailModal.setAttribute('aria-hidden', 'true');
        }
    }
    
    if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeDetailModal);
    if (modalCloseBackdrop) modalCloseBackdrop.addEventListener('click', closeDetailModal);


    // --- 10. Mock Inquiry Form (Contact Form Submit Handler) ---
    const contactForm = document.getElementById('project-contact-form');
    const feedbackMessage = document.getElementById('form-feedback-message');
    
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            if (feedbackMessage) {
                feedbackMessage.textContent = '문의를 전송 중입니다...';
                feedbackMessage.className = 'form-feedback-message';
                feedbackMessage.style.color = 'var(--accent)';
            }
            
            setTimeout(() => {
                contactForm.reset();
                if (feedbackMessage) {
                    feedbackMessage.textContent = '문의가 성공적으로 접수되었습니다. 곧 이메일 또는 연락처로 답변을 전달드리겠습니다.';
                    feedbackMessage.className = 'form-feedback-message success';
                    feedbackMessage.style.color = 'hsl(140, 70%, 50%)';
                }
                
                setTimeout(() => {
                    if (feedbackMessage) feedbackMessage.textContent = '';
                }, 5000);
            }, 1200);
        });
    }


    // --- 11. Scroll To Top Button ---
    const scrollToTopBtn = document.getElementById('scroll-to-top');
    const scrollIndicator = document.getElementById('scroll-indicator-btn');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 500) {
            if (scrollToTopBtn) scrollToTopBtn.classList.add('active');
        } else {
            if (scrollToTopBtn) scrollToTopBtn.classList.remove('active');
        }
    });
    
    if (scrollToTopBtn) {
        scrollToTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
    
    if (scrollIndicator) {
        scrollIndicator.addEventListener('click', () => {
            const portfolioSec = document.getElementById('portfolio');
            if (portfolioSec) {
                portfolioSec.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }

    
    // --- 12. Initialize Core Render Engine (Async Load) ---
    loadStaticDatabase().then(() => {
        renderPortfolio();
        renderHeroSlider();
    });
});
