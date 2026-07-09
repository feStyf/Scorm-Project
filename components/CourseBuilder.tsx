import React, { useState, useRef, useEffect } from 'react';
import { Course, Lesson, FileContext, Module } from '../types';
import * as GeminiService from '../services/geminiService';
import { getScormTemplate } from '../utils/scormGenerator';

// --- ICONS (Clean, Modern, Lucide-style) ---
const SparklesIcon = ({ className = "w-5 h-5" }) => (<svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L12 3Z"/></svg>);
const BookIcon = ({ className = "w-4 h-4" }) => (<svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>);
const LayoutIcon = ({ className = "w-5 h-5" }) => (<svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="3" x2="21" y1="9" y2="9"/><line x1="9" x2="9" y1="21" y2="9"/></svg>);
const DownloadIcon = ({ className = "w-4 h-4" }) => (<svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>);
const UploadIcon = ({ className = "w-8 h-8" }) => (<svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>);
const TrashIcon = ({ className = "w-4 h-4" }) => (<svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>);
const EditIcon = ({ className = "w-4 h-4" }) => (<svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>);
const EyeIcon = ({ className = "w-4 h-4" }) => (<svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>);
const VideoIcon = ({ className = "w-4 h-4" }) => (<svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2" ry="2"/><polygon points="10 8 16 12 10 16 10 8"/></svg>);
const DriveIcon = ({ className = "w-4 h-4" }) => (<svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 10l-4 4l6 6l4 -16l-18 7l4 1l2 6z" /></svg>);
const LinkIcon = ({ className = "w-4 h-4" }) => (<svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>);
const ChevronRight = ({ className = "w-4 h-4" }) => (<svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>);
const WandIcon = ({ className = "w-4 h-4" }) => (<svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 4V2"/><path d="M15 16v-2"/><path d="M8 9h2"/><path d="M20 9h2"/><path d="M17.8 11.8 19 13"/><path d="M15 9h0"/><path d="M17.8 6.2 19 5"/><path d="m3 21 9-9"/><path d="M12.2 6.2 11 5"/></svg>);
const ImageIcon = ({ className = "w-4 h-4" }) => (<svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>);
const LayersIcon = ({ className = "w-4 h-4" }) => (<svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>);

interface CourseBuilderProps {}

const CourseBuilder: React.FC<CourseBuilderProps> = () => {
  // Input State
  const [courseObjective, setCourseObjective] = useState('');
  const [courseStructure, setCourseStructure] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [docUrl, setDocUrl] = useState('');
  const [files, setFiles] = useState<FileContext[]>([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // App State
  const [course, setCourse] = useState<Course | null>(null);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [generatingImageId, setGeneratingImageId] = useState<string | null>(null);
  
  // Editor State
  const [isEditing, setIsEditing] = useState(false);
  const [mediaInput, setMediaInput] = useState('');
  const [mediaType, setMediaType] = useState<'video' | 'drive' | null>(null);
  
  // Mobile UI State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Iframe Auto-Resize State
  const [iframeHeight, setIframeHeight] = useState('600px');

  useEffect(() => {
    setIframeHeight('600px'); // Reset height when lesson changes
  }, [activeLessonId]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'resize-iframe') {
        setIframeHeight(`${event.data.height}px`);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Mermaid Initialization
  useEffect(() => {
    if (activeLessonId && !isEditing) {
      // @ts-ignore
      if (window.mermaid) {
        // @ts-ignore
        window.mermaid.init(undefined, document.querySelectorAll('.mermaid'));
      }
    }
  }, [activeLessonId, isEditing, course]);

  // Load Mermaid Script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = "https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js";
    script.onload = () => {
      // @ts-ignore
      window.mermaid.initialize({ startOnLoad: true, theme: 'neutral' });
    };
    document.head.appendChild(script);
  }, []);

  // --- File Handlers ---
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles: FileContext[] = [];
      for (let i = 0; i < e.target.files.length; i++) {
        const file = e.target.files[i];
        const base64 = await convertFileToBase64(file);
        newFiles.push({
          name: file.name,
          mimeType: file.type,
          data: base64
        });
      }
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  // --- Course Generation Handlers ---
  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseObjective.trim()) return;

    setLoading(true);
    try {
      const generatedCourse = await GeminiService.generateCourseOutline(
        courseObjective,
        courseStructure,
        targetAudience, 
        files,
        docUrl
      );
      setCourse(generatedCourse);
      
      if (generatedCourse.modules.length > 0 && generatedCourse.modules[0].lessons.length > 0) {
        setActiveLessonId(generatedCourse.modules[0].lessons[0].id);
        fetchLessonContent(generatedCourse.modules[0].lessons[0], generatedCourse);
      }
    } catch (error) {
      console.error("Error creating course:", error);
      alert("Falha ao criar a estrutura do curso. Por favor, tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const fetchLessonContent = async (lesson: Lesson, currentCourse: Course) => {
    if (lesson.content) return;
    
    updateLesson(lesson.id, { isLoading: true, statusMessage: "Iniciando Agentes de IA..." });
    
    try {
      const content = await GeminiService.generateLessonContent(
        lesson.title, 
        lesson.type,
        currentCourse,
        (status) => updateLesson(lesson.id, { statusMessage: status }) // Callback for status updates
      );
      updateLesson(lesson.id, { content, isLoading: false, statusMessage: undefined });
    } catch (error) {
      updateLesson(lesson.id, { 
        isLoading: false, 
        statusMessage: undefined,
        content: "<div class='p-8 text-red-500'>Erro ao gerar conteúdo. Verifique se as informações estão na documentação fornecida.</div>" 
      });
    }
  };

  const generateImageForLesson = async (lesson: Lesson) => {
    if (!lesson.imagePrompt) return;
    setGeneratingImageId(lesson.id);
    try {
      const imageUrl = await GeminiService.generateLessonImage(lesson.imagePrompt);
      if (imageUrl) {
        updateLesson(lesson.id, { imageUrl });
      }
    } finally {
      setGeneratingImageId(null);
    }
  };

  const updateLesson = (lessonId: string, updates: Partial<Lesson>) => {
    setCourse(prev => {
      if (!prev) return null;
      const newModules = prev.modules.map(mod => ({
        ...mod,
        lessons: mod.lessons.map(les => 
          les.id === lessonId ? { ...les, ...updates } : les
        )
      }));
      return { ...prev, modules: newModules };
    });
  };

  // --- Editor Handlers ---
  const handleContentChange = (newContent: string) => {
    if (activeLessonId) {
      updateLesson(activeLessonId, { content: newContent });
    }
  };

  // Improved ID extraction for robustness
  const getYoutubeId = (url: string) => {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : null;
  };

  const insertMedia = () => {
    if (!mediaInput || !activeLessonId) return;
    const lesson = getActiveLesson();
    if (!lesson) return;

    let snippet = '';
    
    if (mediaType === 'video') {
      const videoId = getYoutubeId(mediaInput);
      
      if (videoId) {
        const origin = window.location.origin;
        snippet = `
          <div class="my-8 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
             <div class="aspect-video-wrapper bg-slate-100 relative pb-[56.25%] h-0 overflow-hidden rounded-lg">
                <iframe 
                  src="https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&origin=${origin}" 
                  class="absolute top-0 left-0 w-full h-full" 
                  frameborder="0" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                  referrerpolicy="strict-origin-when-cross-origin" 
                  allowfullscreen>
                </iframe>
             </div>
             <div class="mt-2 text-right">
                <a href="https://www.youtube.com/watch?v=${videoId}" target="_blank" rel="noopener noreferrer" class="text-xs text-blue-500 hover:underline"><i class="fas fa-external-link-alt"></i> Assistir no YouTube (caso o vídeo não carregue)</a>
             </div>
          </div>
        `;
      } else {
        alert("Link do YouTube inválido.");
        return;
      }
    } else if (mediaType === 'drive') {
      snippet = `
        <div class="my-6 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-4 hover:bg-blue-100 transition">
           <div class="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white"><i class="fas fa-cloud-download-alt"></i></div>
           <div class="flex-1">
             <h4 class="font-bold text-slate-800">Material Complementar</h4>
             <p class="text-sm text-slate-600">Acesse o arquivo no Google Drive.</p>
           </div>
           <a href="${mediaInput}" target="_blank" class="px-4 py-2 bg-white text-blue-600 font-bold rounded-lg shadow-sm hover:shadow-md transition">Acessar</a>
        </div>
      `;
    }

    if (snippet) {
      updateLesson(activeLessonId, { content: (lesson.content || '') + snippet });
    }
    
    setMediaInput('');
    setMediaType(null);
  };

  // --- Export Logic ---
  const handleExport = () => {
    if (!course) return;

    // Flatten structure for the template
    let flatIndex = 0;
    const courseData: any[] = [];
    
    // Intro Slide (Now Article Style)
    courseData.push({
      id: flatIndex++,
      title: "Introdução do Curso",
      module: "Visão Geral", // Added module grouping
      type: "content",
      content: `
         <div class="max-w-4xl mx-auto py-12 px-6">
            <div class="border-b border-slate-200 pb-8 mb-8">
               <span class="text-blue-600 font-bold tracking-wider text-sm mb-2 uppercase block">Visão Geral</span>
               <h1 class="text-4xl lg:text-5xl font-extrabold text-slate-900 mb-6 leading-tight">${course.title}</h1>
               <p class="text-xl text-slate-600 leading-relaxed">${course.description}</p>
            </div>
            
            <div class="bg-blue-50 rounded-2xl p-8 border border-blue-100 flex items-start gap-6">
                <div class="text-blue-500 text-3xl mt-1"><i class="fas fa-rocket"></i></div>
                <div>
                   <h3 class="text-lg font-bold text-slate-900 mb-2">Comece sua jornada</h3>
                   <p class="text-slate-700 leading-relaxed">
                     Este curso foi estruturado como uma documentação técnica profunda. 
                     Navegue pelos módulos ao lado para acessar os artigos detalhados sobre cada tópico.
                   </p>
                </div>
            </div>
         </div>
      `
    });

    // Modules & Lessons
    course.modules.forEach(mod => {
      mod.lessons.forEach(lesson => {
        let finalContent = lesson.content || "";
        // Inject Image if exists
        if (lesson.imageUrl && !finalContent.includes('<img')) {
             finalContent = `
               <div class="w-full max-w-4xl mx-auto py-8 px-6">
                 <h1 class="text-3xl font-bold text-slate-900 mb-8 border-b border-slate-100 pb-4">${lesson.title}</h1>
                 
                 <div class="mb-10 rounded-xl overflow-hidden shadow-sm border border-slate-200 bg-slate-50">
                    <img src="${lesson.imageUrl}" alt="${lesson.title}" class="w-full object-cover max-h-[400px]" />
                    <div class="p-3 text-xs text-center text-slate-500 border-t border-slate-200 bg-white">Figura 1: Arquitetura de Referência - ${lesson.title}</div>
                 </div>
                 
                 <div class="${lesson.type === 'article' ? 'prose prose-slate prose-lg max-w-none text-slate-700 leading-relaxed' : ''}">
                   ${finalContent}
                 </div>
               </div>
             `;
        } else {
             finalContent = `
               <div class="w-full max-w-4xl mx-auto py-8 px-6">
                 <h1 class="text-3xl font-bold text-slate-900 mb-8 border-b border-slate-100 pb-4">${lesson.title}</h1>
                 <div class="${lesson.type === 'article' ? 'prose prose-slate prose-lg max-w-none text-slate-700 leading-relaxed' : ''}">
                   ${finalContent}
                 </div>
               </div>
             `;
        }

        courseData.push({
          id: flatIndex++,
          title: lesson.title,
          module: mod.title, // Added module grouping
          type: "content",
          content: finalContent
        });
      });
    });

    // Conclusion Slide
    courseData.push({
      id: flatIndex++,
      title: "Conclusão",
      module: "Encerramento", // Added module grouping
      type: "final",
      content: `
        <div class="max-w-4xl mx-auto py-16 px-6 text-center">
            <div class="mb-8 flex justify-center">
                <div class="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center text-5xl text-white shadow-xl">
                    <i class="fas fa-trophy"></i>
                </div>
            </div>
            <h2 class="text-4xl font-bold text-slate-900 mb-6">Curso Concluído!</h2>
            <p class="text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
                Você completou a leitura técnica de <strong>${course.title}</strong>. 
                Esperamos que esta documentação tenha aprofundado seu entendimento sobre a arquitetura e os fundamentos.
            </p>
            <button onclick="exitCourse()" class="px-8 py-4 magalu-gradient text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 hover:scale-105 transition transform">
                Finalizar e Sair
            </button>
        </div>
      `
    });

    const template = getScormTemplate(JSON.stringify(courseData).replace(/<\/script>/gi, '<\\/script>'), course.title);
    const blob = new Blob([template], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SCORM_${course.title.replace(/\s+/g, '_')}.html`;
    a.click();
  };

  // --- Render Navigation ---
  const handleLessonSelect = (lesson: Lesson) => {
    setActiveLessonId(lesson.id);
    if (!lesson.content && course) {
      fetchLessonContent(lesson, course);
    }
  };

  const getActiveLesson = () => {
    if (!course) return null;
    for (const mod of course.modules) {
      for (const les of mod.lessons) {
        if (les.id === activeLessonId) return les;
      }
    }
    return null;
  };

  const activeLesson = getActiveLesson();

  // --- View: Initial Form (Wizard Style) ---
  if (!course) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-700">
         {/* Simple Navbar */}
         <div className="w-full bg-white border-b border-slate-200 py-4 px-4 md:px-8 flex justify-between items-center">
            <div className="flex items-center gap-2 text-indigo-600 font-bold text-xl tracking-tight">
               <SparklesIcon className="w-6 h-6" />
               <span className="hidden sm:inline">ScormGenAI</span>
            </div>
            <div className="flex items-center gap-4">
               <div className="text-sm text-slate-500 hidden sm:block">v1.1.0</div>
               <img 
                 src="https://media.licdn.com/dms/image/v2/D4D0BAQGlkyJOKvz6WQ/company-logo_200_200/company-logo_200_200/0/1718300941618/extremedigitalsolutions_logo?e=2147483647&v=beta&t=fUKXMHsSI8xi-6Xa5mVIMCWMPQ7wlQUPQZud_XASSls" 
                 alt="Extreme Digital Solutions" 
                 className="h-8 w-auto rounded object-contain" 
                 referrerPolicy="no-referrer"
               />
            </div>
         </div>

         {/* Wizard Content */}
         <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-6">
            <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
               <div className="p-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
               <div className="p-5 sm:p-8 md:p-12">
                  <div className="text-center mb-8 md:mb-10">
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-3 md:mb-4 tracking-tight">Criar Novo Curso</h1>
                    <p className="text-base md:text-lg text-slate-600 max-w-xl mx-auto">
                      Preencha os detalhes abaixo para gerar um curso SCORM baseado exclusivamente em suas referências.
                    </p>
                  </div>

                  <form onSubmit={handleCreateCourse} className="space-y-6 md:space-y-8">
                     
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                        {/* Left Column */}
                        <div className="space-y-6">
                            <div className="space-y-3">
                                <label htmlFor="objective" className="block text-sm font-bold text-slate-800 uppercase tracking-wide">1. Objetivo Geral do Curso</label>
                                <textarea 
                                  id="objective" 
                                  value={courseObjective} 
                                  onChange={(e) => setCourseObjective(e.target.value)} 
                                  placeholder="Ex: Ensinar os fundamentos de Cloud Computing para analistas de negócios..." 
                                  className="w-full p-3 md:p-4 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none resize-none h-24 md:h-32"
                                  disabled={loading}
                                />
                            </div>

                            <div className="space-y-3">
                               <label htmlFor="target" className="block text-sm font-bold text-slate-800 uppercase tracking-wide">2. Público-Alvo</label>
                               <input 
                                 type="text" 
                                 id="target" 
                                 value={targetAudience} 
                                 onChange={(e) => setTargetAudience(e.target.value)} 
                                 placeholder="Ex: Desenvolvedores Sênior, Gestores..." 
                                 className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 outline-none transition-all"
                                 disabled={loading}
                               />
                            </div>
                        </div>

                        {/* Right Column */}
                        <div className="space-y-6">
                             <div className="space-y-3">
                                <label htmlFor="structure" className="block text-sm font-bold text-slate-800 uppercase tracking-wide">3. Estrutura do Curso (Módulos/Tópicos)</label>
                                <textarea 
                                  id="structure" 
                                  value={courseStructure} 
                                  onChange={(e) => setCourseStructure(e.target.value)} 
                                  placeholder="Ex: 
- Módulo 1: Introdução
- Módulo 2: Arquitetura
- Módulo 3: Prática..." 
                                  className="w-full p-3 md:p-4 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none resize-none h-24 md:h-32"
                                  disabled={loading}
                                />
                            </div>
                            
                             <div className="space-y-3">
                               <label htmlFor="docUrl" className="block text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2"><LinkIcon className="w-4 h-4 text-blue-500" /> 5. Fonte Oficial (Validação via URL)</label>
                               <input 
                                 type="url" 
                                 id="docUrl" 
                                 value={docUrl} 
                                 onChange={(e) => setDocUrl(e.target.value)} 
                                 placeholder="https://docs.exemplo.com..." 
                                 className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 outline-none transition-all"
                                 disabled={loading}
                               />
                            </div>
                        </div>
                     </div>

                     <div className="space-y-4 pt-4 border-t border-slate-100">
                        <label className="block text-sm font-bold text-slate-800 uppercase tracking-wide">4. Conteúdo Base / Material Didático (Texto Completo da Aula)</label>
                        <div 
                          className={`border-2 border-dashed rounded-xl p-6 md:p-8 text-center transition-all cursor-pointer group ${loading ? 'bg-slate-50 border-slate-200 opacity-50' : 'border-slate-300 hover:border-indigo-400 hover:bg-indigo-50'}`} 
                          onClick={() => !loading && fileInputRef.current?.click()}
                        >
                          <input type="file" ref={fileInputRef} className="hidden" multiple accept="application/pdf,image/*,text/plain" onChange={handleFileChange} />
                          <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                             <UploadIcon className="w-6 h-6" />
                          </div>
                          <p className="text-slate-900 font-medium">Faça upload de Apostilas, Roteiros ou PDFs Completos</p>
                          <p className="text-sm text-slate-500">Importe o conteúdo completo. A IA usará este texto como a fonte principal do curso.</p>
                        </div>
                        {files.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {files.map((file, idx) => (
                              <div key={idx} className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg border border-indigo-100 text-sm font-medium">
                                <span className="truncate max-w-[150px]">{file.name}</span>
                                <button type="button" onClick={(e) => {e.stopPropagation(); removeFile(idx);}} className="text-indigo-400 hover:text-indigo-600"><TrashIcon /></button>
                              </div>
                            ))}
                          </div>
                        )}
                     </div>

                     <button 
                       type="submit" 
                       disabled={loading || !courseObjective.trim()} 
                       className={`w-full py-3 md:py-4 rounded-xl font-bold text-base md:text-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 ${loading ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white'}`}
                     >
                       {loading ? (
                         <><div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" /> <span className="truncate text-xs sm:text-base md:text-lg">Lendo Material e Validando na URL...</span></>
                       ) : (
                         <><SparklesIcon /> <span>Gerar Curso</span></>
                       )}
                     </button>
                  </form>
               </div>
            </div>
            
            <div className="mt-8 text-center text-slate-400 text-sm">
               Powered by Google Gemini Nano • Real-time Docs Reading
            </div>
         </div>
      </div>
    );
  }

  // --- View: Workspace (Editor) ---
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans relative">
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-30 md:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* 1. Sidebar Navigation */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-[85vw] max-w-[288px] md:w-72 bg-white border-r border-slate-200 flex flex-col h-full shadow-2xl transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:shadow-sm flex-none ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Brand */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100">
           <div className="flex items-center gap-2 font-bold text-slate-800">
              <div className="bg-indigo-600 p-1.5 rounded-lg text-white"><LayoutIcon className="w-4 h-4"/></div>
              <span className="tracking-tight">CourseBuilder</span>
           </div>
           <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-slate-600">
             <i className="fas fa-times"></i>
           </button>
        </div>
        
        {/* Course Info */}
        <div className="p-6 pb-2">
           <h2 className="font-bold text-lg text-slate-900 leading-tight mb-1 line-clamp-2">{course.title}</h2>
           <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Estrutura do Curso</p>
        </div>

        {/* Navigation Tree */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4 custom-scroll">
          {course.modules.map((module, mIdx) => (
            <div key={module.id} className="animate-fadeIn">
              <div className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                 <span>Módulo {mIdx + 1}</span>
              </div>
              <div className="space-y-0.5 mt-1">
                {module.lessons.map((lesson) => (
                  <button 
                    key={lesson.id} 
                    onClick={() => {
                      handleLessonSelect(lesson);
                      if (window.innerWidth < 768) setIsSidebarOpen(false);
                    }} 
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all flex items-center gap-3 group relative
                      ${activeLessonId === lesson.id 
                        ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-sm' 
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                  >
                    {activeLessonId === lesson.id && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-indigo-600 rounded-r-full"></div>}
                    <span className={`flex-none ${activeLessonId === lesson.id ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`}>
                      {lesson.type === 'quiz' ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> : 
                       lesson.type === 'flashcards' ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg> :
                       <BookIcon />}
                    </span>
                    <span className="truncate leading-snug">{lesson.title}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <button onClick={handleExport} className="w-full flex items-center justify-center gap-2 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all">
            <DownloadIcon />
            <span>Exportar SCORM</span>
          </button>
        </div>
      </aside>

      {/* 2. Main Canvas Area */}
      <main className="flex-1 flex flex-col relative h-full bg-slate-100/50 w-full overflow-hidden">
        
        {/* Top Header / Toolbar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-6 z-10 shadow-sm shrink-0">
           {/* Breadcrumbs & Mobile Toggle */}
           <div className="flex items-center gap-3 text-sm text-slate-500 overflow-hidden">
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="md:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                aria-label="Abrir menu"
              >
                <i className="fas fa-bars text-lg"></i>
              </button>
              <span className="hidden md:inline hover:text-slate-800 cursor-pointer transition-colors">Curso</span>
              <ChevronRight className="w-3 h-3 text-slate-300 hidden md:block" />
              <span className="truncate font-medium text-slate-900 max-w-[120px] sm:max-w-[200px] md:max-w-[300px]">{activeLesson ? activeLesson.title : "Selecione uma lição"}</span>
              {activeLesson && activeLesson.isLoading && <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full animate-pulse hidden lg:inline-block">{activeLesson.statusMessage || "Lendo..."}</span>}
           </div>

           {/* Editor Actions */}
           <div className="flex items-center gap-1 md:gap-2">
              {activeLesson && (
                <>
                  {/* Media Insert Group */}
                  <div className="flex bg-slate-100 rounded-lg p-0.5 md:p-1 mr-1 md:mr-2 border border-slate-200">
                      <button 
                        onClick={() => setMediaType(mediaType === 'video' ? null : 'video')} 
                        className={`p-1.5 rounded-md transition-all ${mediaType === 'video' ? 'bg-white shadow text-red-600' : 'text-slate-500 hover:text-slate-700'}`}
                        title="Adicionar Vídeo"
                      >
                         <VideoIcon />
                      </button>
                      <button 
                        onClick={() => setMediaType(mediaType === 'drive' ? null : 'drive')} 
                        className={`p-1.5 rounded-md transition-all ${mediaType === 'drive' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                        title="Adicionar Drive"
                      >
                         <DriveIcon />
                      </button>
                  </div>

                  <button 
                    onClick={() => setIsEditing(!isEditing)} 
                    className={`flex items-center gap-1 md:gap-2 px-2 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-all border ${isEditing ? 'bg-slate-800 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}
                  >
                     {isEditing ? <><EyeIcon /><span className="hidden sm:inline">Preview</span></> : <><EditIcon /><span className="hidden sm:inline">Código</span></>}
                  </button>
                </>
              )}
           </div>
        </header>

        {/* Media Input Popover (Floating) */}
        {mediaType && (
           <div className="absolute top-16 right-4 md:top-20 md:right-6 z-30 w-[calc(100vw-2rem)] sm:w-80 bg-white rounded-xl shadow-xl border border-slate-200 p-4 animate-in slide-in-from-top-2 fade-in">
              <h3 className="text-sm font-bold text-slate-800 mb-2">{mediaType === 'video' ? 'Inserir YouTube' : 'Inserir Google Drive'}</h3>
              <div className="flex gap-2">
                 <input 
                   autoFocus
                   type="text" 
                   value={mediaInput}
                   onChange={(e) => setMediaInput(e.target.value)}
                   placeholder="Cole a URL aqui..."
                   className="flex-1 text-sm border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-indigo-500 transition-colors"
                 />
                 <button onClick={insertMedia} className="bg-indigo-600 text-white px-3 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors">OK</button>
              </div>
           </div>
        )}

        {/* Content Stage */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 flex justify-center">
          {activeLesson ? (
             <div className="w-full max-w-4xl animate-in fade-in zoom-in-95 duration-300">
               {/* Lesson Card */}
               <div className="bg-white min-h-[800px] rounded-xl shadow-sm border border-slate-200 overflow-hidden relative flex flex-col">
                  
                  {/* AI Loading Overlay */}
                  {activeLesson.isLoading && (
                     <div className="absolute inset-0 z-50 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center">
                        <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4 shadow-lg"></div>
                        <p className="text-base md:text-lg text-indigo-900 font-semibold animate-pulse text-center px-4">{activeLesson.statusMessage || "Lendo Material e Consultando URL..."}</p>
                        <p className="text-xs md:text-sm text-indigo-500 mt-2 max-w-md text-center px-4">
                           {activeLesson.statusMessage 
                             ? "O Agente Especialista está validando e refinando o conteúdo com base nos arquivos originais."
                             : "Analisando os arquivos importados (Fonte Primária) e verificando atualizações na URL oficial (Validação) para gerar o artigo técnico."}
                        </p>
                     </div>
                  )}

                  {isEditing ? (
                     <div className="flex-grow flex flex-col bg-slate-900">
                        <div className="flex-none bg-slate-800 px-3 md:px-4 py-2 text-[10px] md:text-xs text-slate-400 font-mono flex justify-between items-center">
                           <span>HTML SOURCE CODE</span>
                           <span className="bg-slate-700 px-2 py-0.5 rounded text-slate-300">Tailwind CSS</span>
                        </div>
                        <textarea 
                           className="flex-grow w-full p-4 md:p-6 font-mono text-xs md:text-sm text-slate-300 bg-slate-900 focus:outline-none resize-none leading-relaxed"
                           value={activeLesson.content || ''}
                           onChange={(e) => handleContentChange(e.target.value)}
                           spellCheck={false}
                        />
                     </div>
                  ) : (
                     <div className="flex-grow flex flex-col">
                        {/* Image Header or Generator */}
                        <div className="flex-none border-b border-slate-100 bg-slate-50/30 p-6 flex flex-col items-center justify-center min-h-[160px] relative group">
                           {activeLesson.imageUrl ? (
                              <div className="relative w-full">
                                 <img src={activeLesson.imageUrl} alt="Lesson Header" className="w-full h-64 object-cover rounded-lg shadow-sm" />
                                 <button 
                                    onClick={() => generateImageForLesson(activeLesson)}
                                    className="absolute bottom-4 right-4 bg-white/90 backdrop-blur text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold shadow hover:bg-white transition-all opacity-0 group-hover:opacity-100"
                                 >
                                    Regenerar Imagem
                                 </button>
                              </div>
                           ) : (
                              !activeLesson.isLoading && (
                                 <div className="text-center">
                                    <div className="bg-indigo-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 text-indigo-500">
                                       <ImageIcon className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-sm font-semibold text-slate-700 mb-1">Ilustração Visual</h3>
                                    <p className="text-xs text-slate-500 mb-4 max-w-xs mx-auto">Adicione um diagrama ou ilustração gerada por IA para enriquecer o conteúdo.</p>
                                    <button 
                                       onClick={() => generateImageForLesson(activeLesson)}
                                       className="bg-white border border-indigo-200 text-indigo-600 px-4 py-2 rounded-lg text-sm font-semibold shadow-sm hover:bg-indigo-50 hover:border-indigo-300 transition-all flex items-center gap-2 mx-auto"
                                    >
                                       {generatingImageId === activeLesson.id ? <><div className="w-3 h-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"/> <span>Criando...</span></> : <><WandIcon /> <span>Gerar com Nano Banana</span></>}
                                    </button>
                                 </div>
                              )
                           )}
                        </div>

                        {/* HTML Content Render */}
                        <div className="flex-grow relative">
                           {activeLesson.content ? (
                              <iframe 
                                srcDoc={`
                                  <!DOCTYPE html>
                                  <html>
                                  <head>
                                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                                    <script src="https://cdn.tailwindcss.com?plugins=typography"></script>
                                    <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
                                    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
                                    <style>
                                      body { font-family: 'Inter', sans-serif; padding: 1rem; margin: 0; overflow-y: hidden; }
                                      /* Override Tailwind vh classes to prevent infinite loops in iframe */
                                      .min-h-screen { min-height: 100% !important; }
                                      .h-screen { height: 100% !important; }
                                      .h-full { height: auto !important; }
                                    </style>
                                  </head>
                                  <body>
                                    <div id="content-wrapper" class="${activeLesson.type === 'article' ? 'prose prose-slate prose-lg max-w-none text-slate-700 leading-relaxed' : ''}">
                                      ${activeLesson.content}
                                    </div>
                                    <script>
                                      let lastHeight = 0;
                                      let consecutiveGrowths = 0;
                                      let lastGrowthTime = 0;
                                      let observer = null;

                                      function sendHeight() {
                                        const height = document.documentElement.scrollHeight; 
                                        
                                        if (Math.abs(lastHeight - height) > 5) {
                                          const now = Date.now();
                                          
                                          // Loop protection: detect rapid consecutive growths
                                          if (height > lastHeight) {
                                            if (now - lastGrowthTime < 500) {
                                              consecutiveGrowths++;
                                            } else {
                                              consecutiveGrowths = 1;
                                            }
                                            lastGrowthTime = now;
                                            
                                            if (consecutiveGrowths > 10) {
                                              console.warn('Infinite resize loop detected. Disconnecting observer.');
                                              if (observer) observer.disconnect();
                                              return;
                                            }
                                          } else {
                                            consecutiveGrowths = 0;
                                          }

                                          lastHeight = height;
                                          window.parent.postMessage({ type: 'resize-iframe', height: height }, '*');
                                        }
                                      }
                                      
                                      window.addEventListener('load', () => {
                                        sendHeight();
                                        if (window.mermaid) {
                                          setTimeout(() => {
                                            mermaid.init(undefined, document.querySelectorAll('.mermaid'));
                                            sendHeight();
                                          }, 100);
                                        }
                                      });
                                      
                                      // Use ResizeObserver on the body
                                      observer = new ResizeObserver(() => {
                                        sendHeight();
                                      });
                                      observer.observe(document.body);
                                    </script>
                                  </body>
                                  </html>
                                `}
                                className="w-full border-0 transition-all duration-300"
                                style={{ height: iframeHeight, minHeight: '600px' }}
                                title="Lesson Preview"
                              />
                           ) : (
                              <div className="h-full flex items-center justify-center text-slate-300 text-sm">
                                 Aguardando geração de conteúdo...
                              </div>
                           )}
                        </div>
                     </div>
                  )}
               </div>
             </div>
          ) : (
             <div className="flex flex-col items-center justify-center h-full text-slate-400 opacity-60 px-4">
               <div className="w-20 h-20 md:w-24 md:h-24 bg-slate-200 rounded-full flex items-center justify-center mb-4 md:mb-6">
                  <LayoutIcon className="w-8 h-8 md:w-10 md:h-10 text-slate-400" />
               </div>
               <p className="text-base md:text-lg font-medium text-slate-500 text-center">Selecione uma lição no menu lateral</p>
               <p className="text-xs md:text-sm text-center mt-1">ou exporte o curso completo quando terminar</p>
             </div>
          )}
        </div>
      </main>

    </div>
  );
};

export default CourseBuilder;