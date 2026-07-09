/**
 * Generates the full HTML string for the SCORM package.
 * This includes the responsive sidebar, content renderer, and SCORM 1.2/2004 connectivity.
 */
export const getScormTemplate = (dataJson: string, title: string) => `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <script src="https://cdn.tailwindcss.com?plugins=typography"></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500&display=swap');
        
        body { font-family: 'Inter', sans-serif; background-color: #f8fafc; overflow: hidden; user-select: none; }
        .magalu-gradient { background: linear-gradient(135deg, #0086FF 0%, #0050e6 100%); }
        .fade-enter { animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        
        /* Scrollbar Styling */
        .custom-scroll::-webkit-scrollbar { width: 8px; height: 8px; }
        .custom-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scroll::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        
        /* Sidebar Animations */
        #sidebar { transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .sidebar-open { transform: translateX(0); }
        .sidebar-closed { transform: translateX(-100%); }
        @media (min-width: 768px) {
            .sidebar-closed { transform: translateX(0); } /* Always open on desktop for now, or implement collapsible logic if needed */
        }
        
        .active-lesson { background-color: #eff6ff; color: #1d4ed8; border-right: 3px solid #2563eb; font-weight: 600; }
        
        /* Doc Style Overrides */
        h1, h2, h3, h4 { color: #0f172a; font-weight: 700; letter-spacing: -0.025em; }
        p { margin-bottom: 1.5em; }
        code { font-family: 'Fira Code', monospace; background-color: #f1f5f9; padding: 0.2em 0.4em; border-radius: 0.25rem; font-size: 0.9em; color: #0f172a; }
        pre { background-color: #1e293b; color: #f8fafc; padding: 1rem; border-radius: 0.5rem; overflow-x: auto; margin-bottom: 1.5em; }
        pre code { background-color: transparent; color: inherit; padding: 0; }
        ul { list-style-type: disc; padding-left: 1.5rem; margin-bottom: 1.5em; }
        ol { list-style-type: decimal; padding-left: 1.5rem; margin-bottom: 1.5em; }
        li { margin-bottom: 0.5em; }
        strong { color: #0f172a; font-weight: 600; }
        a { color: #2563eb; text-decoration: underline; text-underline-offset: 4px; }
        a:hover { color: #1d4ed8; }

        /* Loader */
        #app-loader {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: #ffffff; z-index: 100;
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            transition: opacity 0.5s ease;
        }
    </style>
</head>
<body class="h-screen flex flex-col text-slate-800 bg-slate-50">

    <!-- Preloader -->
    <div id="app-loader">
        <div class="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <div class="text-slate-500 font-medium animate-pulse">Carregando conteúdo...</div>
    </div>

    <!-- Header -->
    <header class="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 z-30 shrink-0 shadow-sm relative">
        <div class="flex items-center gap-3">
             <button onclick="toggleSidebar()" class="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors md:hidden">
                <i class="fas fa-bars text-lg"></i>
             </button>
             <div>
                <h1 class="font-bold text-slate-800 truncate max-w-[180px] md:max-w-md leading-tight text-sm md:text-base">${title}</h1>
                <p class="text-[10px] text-slate-500 font-bold uppercase tracking-wider hidden md:block">Documentação Técnica</p>
             </div>
        </div>
        <div class="flex items-center gap-4">
             <div class="hidden md:flex flex-col items-end w-32 lg:w-48">
                <div class="flex justify-between w-full text-[10px] font-bold text-slate-500 mb-1"><span>Progresso</span><span id="progress-text">0%</span></div>
                <div class="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden"><div id="progress-bar" class="h-full magalu-gradient transition-all duration-500 ease-out" style="width: 0%"></div></div>
            </div>
            <img src="https://media.licdn.com/dms/image/v2/D4D0BAQGlkyJOKvz6WQ/company-logo_200_200/company-logo_200_200/0/1718300941618/extremedigitalsolutions_logo?e=2147483647&v=beta&t=fUKXMHsSI8xi-6Xa5mVIMCWMPQ7wlQUPQZud_XASSls" class="h-8 md:h-10 w-auto rounded object-contain" alt="EDS Logo">
            <button onclick="exitCourse()" class="text-slate-400 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-50" title="Sair"><i class="fas fa-power-off"></i></button>
        </div>
    </header>

    <!-- Main Workspace -->
    <div class="flex-1 flex overflow-hidden relative">
        
        <!-- Sidebar Navigation -->
        <aside id="sidebar" class="absolute inset-y-0 left-0 z-20 w-[calc(100vw-3rem)] max-w-sm md:w-80 bg-slate-50 border-r border-slate-200 flex flex-col sidebar-closed md:relative md:transform-none shadow-xl md:shadow-none">
            <div class="p-4 border-b border-slate-200 bg-slate-100/50 flex items-center justify-between md:justify-start">
                <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Índice</span>
                <button onclick="toggleSidebar()" class="md:hidden text-slate-400 hover:text-slate-600"><i class="fas fa-times"></i></button>
            </div>
            <nav id="toc" class="flex-1 overflow-y-auto p-3 space-y-1 custom-scroll pb-20"></nav>
        </aside>

        <!-- Overlay for mobile sidebar -->
        <div id="sidebar-overlay" onclick="toggleSidebar()" class="fixed inset-0 bg-black/20 z-10 hidden transition-opacity opacity-0"></div>

        <!-- Content Area -->
        <main class="flex-1 overflow-hidden relative flex flex-col bg-white">
            <div class="flex-1 overflow-y-auto p-0 custom-scroll scroll-smooth bg-white" id="scroll-container">
                 <div id="content-area" class="w-full mx-auto min-h-full fade-enter relative pb-20 p-6 md:p-12">
                    <!-- Content injected here -->
                 </div>
            </div>
            
            <!-- Sticky Navigation Footer -->
            <div class="h-16 bg-white border-t border-slate-100 shrink-0 px-4 md:px-6 flex items-center justify-between z-10">
                 <button id="btn-prev" onclick="prevSlide()" class="group flex items-center gap-2 text-slate-500 font-medium hover:text-slate-800 disabled:opacity-30 transition-all text-xs sm:text-sm">
                    <i class="fas fa-arrow-left group-hover:-translate-x-1 transition-transform"></i>
                    <span class="hidden sm:inline">Anterior</span>
                 </button>
                 
                 <div class="text-[10px] sm:text-xs font-mono text-slate-400">
                    <span id="slide-indicator">1 / 1</span>
                 </div>

                 <button id="btn-next" onclick="nextSlide()" class="group flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-lg bg-slate-900 text-white font-medium hover:bg-slate-800 disabled:opacity-50 transition-all text-xs sm:text-sm shadow-sm">
                    <span class="hidden sm:inline">Próximo Tópico</span>
                    <span class="sm:hidden">Próximo</span>
                    <i class="fas fa-arrow-right group-hover:translate-x-1 transition-transform"></i>
                 </button>
            </div>
        </main>
    </div>

    <script id="course-data" type="application/json">
        ${dataJson}
    </script>
    <script>
        const courseData = JSON.parse(document.getElementById('course-data').textContent);

        // --- MOCK LMS API (Robust implementation for local testing) ---
        window.API = {
            LMSInitialize: function(param) { console.log("[LMS Mock] LMSInitialize"); return "true"; },
            LMSFinish: function(param) { console.log("[LMS Mock] LMSFinish"); return "true"; },
            LMSGetValue: function(element) { 
                console.log("[LMS Mock] LMSGetValue: " + element);
                if (element === "cmi.core.student_id") return "TEST_USER_ID";
                if (element === "cmi.core.student_name") return "Teste Utilizador";
                return "";
            },
            LMSSetValue: function(element, value) { console.log("[LMS Mock] LMSSetValue: " + element + " = " + value); return "true"; },
            LMSCommit: function(param) { console.log("[LMS Mock] LMSCommit"); return "true"; },
            LMSGetLastError: function() { return "0"; },
            LMSGetErrorString: function(code) { return "No error"; },
            LMSGetDiagnostic: function(code) { return "No error"; }
        };
        
        // --- SCORM LOGIC ---
        const scorm = {
            api: null, version: null, startTime: new Date(),
            init: function() {
                try {
                    let parentWin = window.parent;
                    if (parentWin && parentWin.API_1484_11) { 
                        this.api = parentWin.API_1484_11; this.version = "2004"; this.api.Initialize(""); console.log("SCORM 2004 Found");
                    } else if (parentWin && parentWin.API) { 
                        this.api = parentWin.API; this.version = "1.2"; this.api.LMSInitialize(""); console.log("SCORM 1.2 Found");
                    } else { 
                        console.log("Using Local Mock API"); this.api = window.API; this.version = "1.2"; this.api.LMSInitialize("");
                    }
                    if(this.api) this.setStatus("incomplete");
                } catch (e) { console.warn("SCORM Init Error:", e); this.api = window.API; }
            },
            setStatus: function(s) { if(!this.api) return; this.version==="2004" ? this.api.SetValue("cmi.completion_status", s==='passed'?'completed':s) : this.api.LMSSetValue("cmi.core.lesson_status", s); this.commit(); },
            setBookmark: function(l) { if(!this.api) return; this.version==="2004" ? this.api.SetValue("cmi.location", l) : this.api.LMSSetValue("cmi.core.lesson_location", l); this.commit(); },
            getBookmark: function() { if(!this.api) return null; return this.version==="2004" ? this.api.GetValue("cmi.location") : this.api.LMSGetValue("cmi.core.lesson_location"); },
            commit: function() { if(this.api) this.version==="2004" ? this.api.Commit("") : this.api.LMSCommit(""); },
            finish: function() { if(this.api) this.version==="2004" ? this.api.Terminate("") : this.api.LMSFinish(""); }
        };

        let currentSlide = 0;
        
        // --- UI LOGIC ---
        function initApp() {
            scorm.init();
            renderSidebar();
            
            const bookmark = scorm.getBookmark();
            if (bookmark && parseInt(bookmark) > 0) currentSlide = parseInt(bookmark);
            
            renderSlide(currentSlide);
            setupMobileMenu();
            
            setTimeout(() => {
                const loader = document.getElementById('app-loader');
                loader.style.opacity = '0';
                setTimeout(() => loader.remove(), 500);
            }, 800);
        }

        function renderSidebar() {
            const toc = document.getElementById('toc');
            let currentModule = null;

            courseData.forEach((item, index) => {
                if (item.module !== currentModule) {
                    currentModule = item.module;
                    const modHeader = document.createElement('div');
                    modHeader.className = "px-3 py-2 mt-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider";
                    modHeader.innerText = currentModule || "Geral";
                    toc.appendChild(modHeader);
                }

                const btn = document.createElement('button');
                btn.id = "toc-item-" + index;
                btn.className = "w-full text-left px-3 py-2 rounded-md text-sm transition-all flex items-start gap-3 text-slate-600 hover:bg-slate-200 hover:text-slate-900 border border-transparent";
                btn.onclick = () => { renderSlide(index); if(window.innerWidth < 768) toggleSidebar(); };
                
                const icon = document.createElement('i');
                icon.className = (item.type === 'final' ? "fas fa-flag-checkered" : "fas fa-file-alt") + " w-4 mt-0.5 text-slate-400";
                
                const text = document.createElement('span');
                text.className = "leading-tight";
                text.innerText = item.title;

                btn.appendChild(icon);
                btn.appendChild(text);
                toc.appendChild(btn);
            });
        }

        function renderSlide(index) {
            currentSlide = index;
            const container = document.getElementById("content-area");
            const data = courseData[index];
            
            container.classList.remove("fade-enter");
            void container.offsetWidth; 
            container.classList.add("fade-enter");
            
            container.innerHTML = data.content;
            
            // Execute scripts injected via innerHTML
            const scripts = container.querySelectorAll('script');
            scripts.forEach(oldScript => {
                const newScript = document.createElement('script');
                Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
                newScript.appendChild(document.createTextNode(oldScript.innerHTML));
                oldScript.parentNode.replaceChild(newScript, oldScript);
            });

            document.getElementById("scroll-container").scrollTop = 0;

            if(window.mermaid) { setTimeout(() => { mermaid.init(undefined, document.querySelectorAll('.mermaid')); }, 100); }

            updateControls(index, data.type);
            updateProgress();
            updateSidebarActiveState(index);
            scorm.setBookmark(index);

            // Close sidebar on mobile after selection
            if (window.innerWidth < 768) {
                const sidebar = document.getElementById('sidebar');
                if (!sidebar.classList.contains('sidebar-closed')) {
                    toggleSidebar();
                }
            }
        }

        function updateSidebarActiveState(index) {
            document.querySelectorAll('#toc button').forEach(b => {
                b.classList.remove('active-lesson');
                b.classList.add('text-slate-600');
                b.classList.remove('bg-white', 'shadow-sm', 'border-slate-200');
            });
            const active = document.getElementById("toc-item-" + index);
            if(active) {
                active.classList.add('active-lesson');
                active.classList.add('bg-white', 'shadow-sm', 'border-slate-200');
                active.classList.remove('text-slate-600');
                active.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }

        function updateControls(index, type) {
            document.getElementById("slide-indicator").innerText = (index + 1) + " / " + courseData.length;
            document.getElementById("btn-prev").disabled = index === 0;
            const btnNext = document.getElementById("btn-next");
            if (type === "final") {
                btnNext.style.display = "none";
                scorm.setStatus("passed");
            } else { 
                btnNext.style.display = "flex"; 
                btnNext.disabled = index === courseData.length - 1; 
            }
        }

        function updateProgress() {
            const p = ((currentSlide + 1) / courseData.length) * 100;
            document.getElementById("progress-bar").style.width = p + "%";
            document.getElementById("progress-text").innerText = Math.round(p) + "%";
        }

        function toggleSidebar() {
            const sidebar = document.getElementById('sidebar');
            const overlay = document.getElementById('sidebar-overlay');
            const isClosed = sidebar.classList.contains('sidebar-closed');
            if (isClosed) {
                sidebar.classList.remove('sidebar-closed');
                overlay.classList.remove('hidden');
                setTimeout(() => overlay.classList.remove('opacity-0'), 10);
            } else {
                sidebar.classList.add('sidebar-closed');
                overlay.classList.add('opacity-0');
                setTimeout(() => overlay.classList.add('hidden'), 300);
            }
        }

        function setupMobileMenu() {
            window.addEventListener('resize', () => {
                if(window.innerWidth >= 768) {
                    document.getElementById('sidebar').classList.remove('sidebar-closed');
                    document.getElementById('sidebar-overlay').classList.add('hidden');
                } else {
                    document.getElementById('sidebar').classList.add('sidebar-closed');
                }
            });
        }

        function nextSlide() { if (currentSlide < courseData.length - 1) renderSlide(currentSlide + 1); }
        function prevSlide() { if (currentSlide > 0) renderSlide(currentSlide - 1); }
        function exitCourse() { scorm.finish(); window.close(); }
        
        window.onload = initApp;
    </script>
</body>
</html>`;