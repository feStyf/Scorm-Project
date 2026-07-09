import { GoogleGenAI, Type } from "@google/genai";
import { Course, Module, Lesson, FileContext } from "../types";
import aiModelsConfig from "../prompts/modelos_ia.json";

// Helper to ensure we get a fresh client to pick up the latest API key
const getAiClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to run with fallback
const generateWithFallback = async (taskName: keyof typeof aiModelsConfig.tasks, request: any) => {
  const models = aiModelsConfig.tasks[taskName];
  const ai = getAiClient();
  try {
    return await ai.models.generateContent({ ...request, model: models.primary });
  } catch (error: any) {
    console.warn(`Primary model ${models.primary} failed for ${taskName}, falling back to ${models.fallback}. Error:`, error.message);
    return await ai.models.generateContent({ ...request, model: models.fallback });
  }
};

// Helper to clean up JSON string if the model adds backticks or extra text
const cleanJson = (text: string) => {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start !== -1 && end !== -1) {
    return text.substring(start, end + 1);
  }
  return text.replace(/^```json\s*/, "").replace(/\s*```$/, "");
};

// Helper to extract raw base64 from data URI if present
const getBase64Data = (dataUri: string) => {
  return dataUri.includes(',') ? dataUri.split(',')[1] : dataUri;
};

// Helper to clean HTML markdown
const cleanHtmlResponse = (text: string) => {
  return text.replace(/^```html\s*/, "").replace(/^```\s*/, "").replace(/\s*```$/, "");
};

/**
 * Generates a course outline based on provided objective, structure, files, and audience.
 */
export const generateCourseOutline = async (
  courseObjective: string,
  userStructure: string,
  targetAudience: string,
  files: FileContext[],
  docUrl?: string,
  language: string = 'Português do Brasil'
): Promise<Course> => {
  const textPrompt = `Atue como um Arquiteto de Soluções e Tech Lead.
  
  METODOLOGIA HÍBRIDA (ARQUIVOS + REAL-TIME):
  1. FONTE PRIMÁRIA (O TEXTO DA AULA): Os arquivos anexados contêm o CONTEÚDO COMPLETO e o roteiro da aula. Você deve estruturar o curso baseado no texto contido nestes arquivos.
  2. FONTE DE VALIDAÇÃO (URL): O usuário forneceu a URL ${docUrl || 'Nenhuma'}. Use a ferramenta de busca para LER esta página e GARANTIR que o conteúdo dos arquivos não está obsoleto.
  
  OBJETIVO DO CURSO/WIKI:
  ${courseObjective}

  ESTRUTURA SUGERIDA:
  ${userStructure ? userStructure : "Extraia a estrutura lógica (Tópicos/Capítulos) diretamente do texto dos arquivos."}

  PÚBLICO-ALVO:
  ${targetAudience}

  INSTRUÇÕES DE SAÍDA:
  1. A saída deve estar estritamente em ${language}.
  2. Organize em Módulos e Lições.
  3. Para cada lição, crie um 'imagePrompt' para um diagrama de arquitetura técnica.
  4. OBRIGATÓRIO: Ao final de CADA módulo, adicione uma lição do tipo "quiz" (questionário) sobre o conteúdo daquele módulo. O questionário deve ter 3 perguntas com 3 alternativas sendo apenas 1 correta. Caso seja respondido com a resposta errada, será apresentada uma explicação do motivo.
  5. OBRIGATÓRIO: Crie um módulo final padrão chamado "Revisão Final" contendo apenas uma lição do tipo "flashcards" apresentando 5 flashcards sobre os principais termos-chave que o aluno deve se lembrar.
  6. Defina o campo 'type' de cada lição como 'article', 'quiz' ou 'flashcards'.
  7. Retorne APENAS um objeto JSON válido com a seguinte estrutura exata:
  {
    "title": "Título do Curso",
    "description": "Descrição do curso",
    "modules": [
      {
        "title": "Nome do Módulo",
        "lessons": [
          {
            "title": "Nome da Lição",
            "type": "article" | "quiz" | "flashcards",
            "imagePrompt": "Descrição técnica detalhada para diagrama de arquitetura."
          }
        ]
      }
    ]
  }
  Não inclua marcações markdown como \`\`\`json, retorne apenas o JSON puro.`;

  const parts: any[] = [{ text: textPrompt }];
  
  files.forEach(file => {
    parts.push({
      inlineData: {
        mimeType: file.mimeType,
        data: getBase64Data(file.data)
      }
    });
  });

  const response = await generateWithFallback("course_outline", {
    contents: { parts },
    config: {
      tools: [{ googleSearch: {} }]
    }
  });

  const rawText = response.text || "{}";
  let data: any = {};
  try {
    data = JSON.parse(cleanJson(rawText));
  } catch (error) {
    console.error("Failed to parse JSON from Gemini response:", rawText);
    throw new Error("A resposta da IA não foi um JSON válido. Por favor, tente novamente.");
  }

  const course: Course = {
    id: crypto.randomUUID(),
    title: data.title || "Curso Gerado",
    description: data.description || "",
    language: language,
    targetAudience: targetAudience,
    contextFiles: files,
    docUrl: docUrl,
    modules: (data.modules || []).map((m: any) => ({
      id: crypto.randomUUID(),
      title: m.title || "Módulo",
      lessons: (m.lessons || []).map((l: any) => ({
        id: crypto.randomUUID(),
        title: l.title || "Lição",
        type: l.type || 'article',
        imagePrompt: l.imagePrompt || "",
        content: "", 
      }))
    }))
  };

  return course;
};

/**
 * 2-STEP GENERATION PROCESS
 * 1. Agent Drafter: Creates content from files.
 * 2. Agent Reviewer: Validates against files and refines didactic structure.
 */
export const generateLessonContent = async (
  lessonTitle: string, 
  lessonType: string = 'article',
  course: Course,
  onStatusUpdate?: (status: string) => void
): Promise<string> => {
  // --- AGENT 1: DRAFTER ---
  if (onStatusUpdate) onStatusUpdate("Agente 1: Rascunhando conteúdo base...");
  
  let drafterPrompt = '';
  
  if (lessonType === 'quiz') {
    drafterPrompt = `ROLE: Especialista em Avaliação e Ensino.
    
    TAREFA: Criar um questionário (Quiz) interativo em HTML/JS para a lição: "${lessonTitle}".
    
    FONTE DE DADOS:
    Use o conteúdo do curso ("${course.description}") e os arquivos anexados para gerar as perguntas.
    
    REGRAS DO QUESTIONÁRIO:
    1. Crie exatamente 3 perguntas sobre o conteúdo do módulo.
    2. Cada pergunta deve ter exatamente 3 alternativas.
    3. Apenas 1 alternativa deve ser a correta.
    4. Caso o usuário selecione uma resposta errada, deve aparecer uma explicação clara do motivo daquela alternativa estar incorreta.
    
    ESTILO E FORMATO:
    - Retorne APENAS o código HTML completo (com CSS Tailwind e JavaScript embutido) que renderiza o quiz.
    - O design deve ser moderno e TOTALMENTE RESPONSIVO (mobile-first), usando as classes do Tailwind CSS (ex: w-full, sm:w-1/2, p-4 md:p-6, etc).
    - O JavaScript deve gerenciar o estado do quiz de forma robusta.
    
    ESTRUTURA JAVASCRIPT OBRIGATÓRIA (Siga este padrão para evitar bugs de índice):
    - Crie um array de objetos 'questions' com { question, options: [{text, isCorrect, explanation}], ... }.
    - Use uma variável 'currentQuestionIndex' iniciando em 0.
    - Crie funções 'renderQuestion()', 'checkAnswer(index)', e 'nextQuestion()'.
    - Garanta que ao chegar na última pergunta (índice 2, já que são 3 perguntas), o botão "Próxima" mude para "Finalizar" ou mostre a tela de pontuação final, evitando acessar 'questions[3]' que causaria erro (undefined).
    - IMPORTANTE: Envolva todo o seu código JavaScript em uma IIFE (Immediately Invoked Function Expression) ou use apenas 'var' para evitar erros de redeclaração ao navegar entre as páginas. Não crie variáveis globais com 'let' ou 'const'.
    - Não inclua tags \`<html>\`, \`<head>\` ou \`<body>\`. Retorne apenas a \`<div>\` principal e o \`<script>\`.
    - Compatível com Google Site onde este material será publicado.`;
  } else if (lessonType === 'flashcards') {
    drafterPrompt = `ROLE: Especialista em Memorização e Ensino.
    
    TAREFA: Criar um módulo interativo de Flashcards em HTML/JS para a lição: "${lessonTitle}".
    
    FONTE DE DADOS:
    Use o conteúdo do curso ("${course.description}") e os arquivos anexados para extrair os termos.
    
    REGRAS DOS FLASHCARDS:
    1. Crie exatamente 5 flashcards sobre os principais termos-chave que o aluno deve se lembrar.
    2. Cada flashcard deve ter uma "Frente" (a definição, explicação ou pergunta) e um "Verso" (o termo conceitual ou resposta exata). A dinâmica foi invertida: o aluno lê a explicação na frente e diz o termo antes de virar.
    
    ESTILO E FORMATO:
    - Retorne APENAS o código HTML completo (com CSS Tailwind e JavaScript embutido) que renderiza os flashcards.
    - O design deve ser moderno e TOTALMENTE RESPONSIVO (mobile-first), usando as classes do Tailwind CSS (ex: w-full, md:w-96, h-64, etc).
    - Implemente o efeito de "virar" (flip) o card usando CSS (transform: rotateY) e JavaScript para alternar a classe.
    - Adicione botões de "Próximo" e "Anterior" para navegar entre os 5 flashcards.
    
    ESTRUTURA JAVASCRIPT OBRIGATÓRIA (Siga este padrão para evitar bugs de índice):
    - Crie um array de objetos 'flashcards' com { front, back }.
    - Use uma variável 'currentCardIndex' iniciando em 0.
    - Crie funções 'renderCard()', 'nextCard()', e 'prevCard()'.
    - Garanta que os botões "Próximo" e "Anterior" fiquem desabilitados ou ocultos nos limites do array (índice 0 e índice 4) para evitar erros de undefined.
    - IMPORTANTE: Envolva todo o seu código JavaScript em uma IIFE (Immediately Invoked Function Expression) ou use apenas 'var' para evitar erros de redeclaração ao navegar entre as páginas. Não crie variáveis globais com 'let' ou 'const'.
    - Não inclua tags \`<html>\`, \`<head>\` ou \`<body>\`. Retorne apenas a \`<div>\` principal e o \`<script>\`.
    - Compatível com Google Site onde este material será publicado.`;
  } else {
    drafterPrompt = `ROLE: Technical Writer Sênior.
    
    TAREFA: Escrever o PRIMEIRO RASCUNHO para a lição: "${lessonTitle}".
    
    FONTE DE DADOS (HIERARQUIA):
    1. Texto Base (FONTE DA VERDADE): use estritamente o conteudo da url apresentada pelo usuario (${course.docUrl || 'Nenhuma'}), ela aponta a documentação oficial.
    2. Texto Base (FONTE DE COMPLEMENTO): Use estritamente os arquivos anexados pelo usuário. Encontre o trecho relevante no material.
    3. Texto Base (FONTE DE CONTEXTO): use o objetivo geral do curso ("${course.description}") como orientação para oque deseja ensinar.
    4. Validação (ANTI-ALUCINAÇÃO): Use a ferramenta de busca (Google Search) na URL oficial fornecida APENAS para verificar se comandos ou versões não estão depreciados.

    ESTILO:
    - Artigo Técnico (Wiki Style).
    - Profundidade Técnica: Explique a arquitetura e os "Porquês" (First Principles).
    - Formatação: HTML Válido com classes Tailwind CSS.
    - Design Responsivo: O HTML gerado DEVE ser totalmente responsivo (mobile-first). Use classes do Tailwind (sm:, md:, lg:) para garantir que o layout se adapte a celulares e tablets. Garanta que imagens, tabelas e vídeos tenham 'max-w-full' e 'overflow-x-auto' quando necessário.
    - Crie conforme a estrutura/quantidade de modulos apresentada pelo usuario.
    - Publico alvo: "${course.targetAudience}" (ajuda a entender o nível de conhecimento técnico, idade e objetivos de aprendizagem).
    - Sempre coloque ao final o link de onde voce retirou aquela parte do conteudo, ou seja, ao final sempre coloque o link das referencias.
    
    SAÍDA ESPERADA:
    Conteúdo HTML bruto do rascunho da aula.
    Compatível com Google Site onde este material será publicado.`;
  }

  const drafterParts: any[] = [{ text: drafterPrompt }];
  course.contextFiles.forEach(file => {
    drafterParts.push({
      inlineData: {
        mimeType: file.mimeType,
        data: getBase64Data(file.data)
      }
    });
  });

  const draftResponse = await generateWithFallback("lesson_drafting", {
    contents: { parts: drafterParts },
    config: { tools: [{ googleSearch: {} }] }
  });

  const draftContent = cleanHtmlResponse(draftResponse.text || "");

  // --- AGENT 2: REVIEWER PROFESSOR ---
  if (onStatusUpdate) onStatusUpdate("Agente 2 (Professor): Auditando e corrigindo conformidade...");

  let reviewerPrompt = '';
  
  if (lessonType === 'quiz' || lessonType === 'flashcards') {
    reviewerPrompt = `ROLE: PROFESSOR ESPECIALISTA e AUDITOR DE CONTEÚDO (QA).
    
    SUA MISSÃO CRÍTICA:
    Você deve revisar o código HTML/JS do ${lessonType === 'quiz' ? 'questionário' : 'flashcards'} abaixo para garantir que funciona perfeitamente e que o conteúdo está correto.

    ENTRADAS:
    1. MATERIAL ORIGINAL: URL (${course.docUrl || 'Nenhuma'}) e Arquivos Anexados.
    2. RASCUNHO GERADO PELO AGENTE 1: 
    """
    ${draftContent}
    """

    LISTA DE VERIFICAÇÃO (AUDITORIA):
    1. CONFORMIDADE: As perguntas/termos estão corretos e de acordo com o material base?
    2. FUNCIONAMENTO: O código HTML/JS está completo e funcional? Se houver erros de sintaxe ou lógica no JavaScript, corrija-os. PRESTE MUITA ATENÇÃO aos limites de arrays (ex: acessar a pergunta 3 em um array de tamanho 3 causa erro undefined). Garanta que a transição entre perguntas e a tela final de pontuação funcionem sem erros no console.
    3. ESCOPO JS: O código JavaScript DEVE estar contido em uma IIFE ou usar apenas 'var' para evitar erros de redeclaração. Corrija se necessário.
    4. CLAREZA: O design está legível usando Tailwind CSS?

    RESTRIÇÃO DE SAÍDA (SILENT MODE):
    - Retorne APENAS o HTML/JS FINAL, polido e auditado.
    - NÃO adicione comentários como "Aqui está a versão corrigida".
    - NÃO explique o que você mudou.
    - O usuário final não deve saber que houve uma revisão, apenas receber o código perfeito.`;
  } else {
    reviewerPrompt = `ROLE: PROFESSOR ESPECIALISTA e AUDITOR DE CONTEÚDO (QA).
    
    SUA MISSÃO CRÍTICA:
    Você deve revisar o rascunho abaixo para garantir CONFORMIDADE TOTAL com o Material Didático Original (Arquivos Anexados e URL).

    ENTRADAS:
    1. MATERIAL ORIGINAL: URL (${course.docUrl || 'Nenhuma'}) e Arquivos Anexados.
    2. RASCUNHO GERADO PELO AGENTE 1: 
    """
    ${draftContent}
    """

    LISTA DE VERIFICAÇÃO (AUDITORIA):
    1. CONFORMIDADE: O rascunho inventou algo que não está no material base? Se sim, REMOVA ou CORRIJA para alinhar estritamente com a fonte. O material original tem autoridade final sobre o escopo.
    2. DIDÁTICA: O conteúdo explica o "Porquê"? Se estiver muito "passo-a-passo" sem teoria, ADICIONE explicações teóricas baseadas no material original.
    3. CLAREZA: O formato está legível? Melhore a estrutura HTML se necessário.

    RESTRIÇÃO DE SAÍDA (SILENT MODE):
    - Retorne APENAS o HTML FINAL, polido e auditado.
    - NÃO adicione comentários como "Aqui está a versão corrigida".
    - NÃO explique o que você mudou.
    - O usuário final não deve saber que houve uma revisão, apenas receber o conteúdo perfeito.`;
  }

  const reviewerParts: any[] = [{ text: reviewerPrompt }];
  // Re-attach files so the reviewer can audit against them
  course.contextFiles.forEach(file => {
    reviewerParts.push({
      inlineData: {
        mimeType: file.mimeType,
        data: getBase64Data(file.data)
      }
    });
  });

  const finalResponse = await generateWithFallback("lesson_reviewing", {
    contents: { parts: reviewerParts },
    config: { 
      thinkingConfig: { thinkingBudget: 2048 } // Budget for auditing logic
    }
  });

  return cleanHtmlResponse(finalResponse.text || "");
};

/**
 * Generates an educational image using the Nano Banana model.
 */
export const generateLessonImage = async (imagePrompt: string): Promise<string | undefined> => {
  const refinedPrompt = `Technical architecture diagram, blueprint style, isometric view or flat schematic. Detailed representation of: ${imagePrompt}. White background, corporate blue/slate color palette, clean vector lines, high resolution, engineering drawing style.`;

  try {
    const response = await generateWithFallback("image_generation", {
      contents: { parts: [{ text: refinedPrompt }] }
    });
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData && part.inlineData.data) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
  } catch (error) {
    console.error("Image generation failed:", error);
    return undefined;
  }
  return undefined;
};