# Sequenciamento de Modelos de IA na Aplicação

Este documento descreve a estratégia de utilização e o sequenciamento (fallback) dos modelos de Inteligência Artificial do Google (Gemini) aplicados na geração dos cursos SCORM.

A lógica implementada prioriza sempre os modelos mais recentes e avançados (família Gemini 3.1) para garantir a máxima qualidade do conteúdo gerado. Caso o limite de uso (quota) do modelo primário seja atingido ou ocorra alguma instabilidade, o sistema automaticamente fará o *fallback* (recurso de segurança) para o modelo Gemini de suporte (como o gemini-3.5-flash), garantindo que o processo não seja interrompido.

Esta configuração está aplicada diretamente no arquivo `modelos_ia.json` e é consumida pelo serviço `geminiService.ts`.

## 1. Geração da Estrutura do Curso (Course Outline)
Responsável por analisar os arquivos anexados e criar os módulos, lições e questionários.
*   **Modelo Primário:** `gemini-3.1-pro-preview` (Maior capacidade de raciocínio para estruturação complexa).
*   **Modelo Secundário (Fallback):** `gemini-3.5-flash` (Rápido e eficiente caso o modelo primário falhe).

## 2. Agente 1: Rascunho de Conteúdo (Lesson Drafting)
Responsável por escrever o conteúdo bruto de cada lição (artigos, quizzes e flashcards) em HTML/Tailwind.
*   **Modelo Primário:** `gemini-3.1-pro-preview` (Garante profundidade técnica e formatação rica).
*   **Modelo Secundário (Fallback):** `gemini-3.5-flash` (Alternativa de alta velocidade).

## 3. Agente 2: Revisor e Auditor (Lesson Reviewing)
Responsável por auditar o código gerado pelo Agente 1, corrigir erros de JavaScript (como escopo de variáveis) e garantir a qualidade final.
*   **Modelo Primário:** `gemini-3.1-pro-preview` (Excelência em revisão de código e auditoria lógica).
*   **Modelo Secundário (Fallback):** `gemini-3.5-flash` (Modelo robusto para tarefas analíticas e verificação de fluxo).

## 4. Geração de Imagens e Diagramas (Image Generation)
Responsável por gerar ilustrações técnicas e diagramas baseados nos prompts criados durante a estruturação.
*   **Modelo Primário:** `gemini-3.1-flash-image` (Geração de imagens de altíssima qualidade e precisão técnica).
*   **Modelo Secundário (Fallback):** `gemini-2.5-flash-image` (Modelo padrão de geração de imagens, utilizado caso a nova versão esgote a cota).

---
*Nota: A implementação técnica do fallback está no método `generateWithFallback` dentro de `services/geminiService.ts`, que captura falhas do modelo primário e tenta novamente com a opção secundária de forma transparente para o usuário.*
