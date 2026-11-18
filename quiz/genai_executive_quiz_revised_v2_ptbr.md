# GenAI e Modelos de Fundação — Quiz de Tomada de Decisão Executiva (Revisado)

**Curso:** Introdução à IA e Machine Learning — Executive Master in Artificial Intelligence for Business  
**Baseado em:** 
- Aula 4 — Introdução à IA Generativa; 
- Aula 5 — Modelos de GenAI: Recursos e Limitações; 
- Aulas 6 e 7 — Construindo e Aprimorando Sistemas de GenAI  

**Formato:** 10 questões · 4 alternativas (A–D) · **exatamente uma resposta correta por questão**  
**Dificuldade:** 3 Fáceis · 5 Médias · 2 Difíceis  
**Pontuação:** 1 ponto por resposta correta; 10 pontos no total  
**Público:** Executivos; foco em tomada de decisão, não em detalhes técnicos de implementação.

> **Instruções:** Escolha a **única melhor resposta**, considerando **todas as restrições apresentadas em cada cenário de negócio**. Algumas alternativas poderiam funcionar sob outras premissas; apenas uma atende ao cenário completo, tal como descrito.

---

# Parte I — Quiz do Aluno (Sem Respostas)

## Fáceis (Questões 1–3)

### Q1 — Escolhendo uma Estratégia de Modelo

Uma empresa de serviços financeiros quer testar IA para **resumir relatórios, extrair informações de contratos e redigir comunicações com clientes**. Ela tem orçamento limitado e quer validar esses casos de uso **antes de investir em treinamento especializado**. Qual é o ponto de partida mais sensato?

- **A.** Construir três modelos separados, específicos para cada tarefa, cada um treinado exclusivamente com seu próprio conjunto de dados rotulado.
- **B.** Começar com um modelo de fundação de uso geral já existente, avaliá-lo nas três tarefas e adaptar a solução ao redor dele onde for necessário.
- **C.** Continuar o pré-treinamento de um modelo existente com todos os documentos internos antes de testar qualquer uma das três tarefas.
- **D.** Selecionar uma das tarefas, otimizar um modelo dedicado para ela e usar seus resultados como evidência de desempenho nas outras duas.

### Q2 — Aprimorando as Instruções

Uma equipe de operações usa GenAI para resumir relatórios semanais de incidentes. Os resumos são, em geral, precisos, mas variam em **estrutura, tom e nível de detalhe**. A equipe quer uma **melhoria rápida e reversível, sem alterar os pesos do modelo**. O que ela deve tentar primeiro?

- **A.** Usar um template de prompt padronizado, com seções explícitas, restrições e alguns exemplos representativos; em seguida, testar os resultados.
- **B.** Aplicar fine-tuning supervisionado com exemplos de resumos de incidentes formatados corretamente.
- **C.** Aumentar a janela de contexto e enviar mais relatórios históricos de incidentes em cada requisição.
- **D.** Recuperar documentos adicionais da empresa via RAG para ampliar o acesso ao conhecimento operacional.

### Q3 — Adequando Capacidades à Tarefa

Um varejista quer um assistente que **compare a fotografia de um produto danificado com a descrição escrita do cliente** e redija uma sugestão de resposta. Qual requisito é essencial na escolha do modelo?

- **A.** Ele deve gerar imagens a partir de prompts escritos, mesmo que não consiga interpretar fotografias enviadas.
- **B.** Ele deve ser especializado em extrair texto de imagens; a aparência do produto pode ser inferida apenas a partir desse texto.
- **C.** Ele deve processar entradas de imagem e de texto e produzir uma resposta em texto.
- **D.** Ele deve aceitar fala e transcrevê-la antes de analisar a reclamação do cliente.

## Médias (Questões 4–8)

### Q4 — Conhecimento Corporativo Atualizado e Restrito

O assistente de RH de uma empresa precisa responder perguntas com base em **políticas internas atualizadas com frequência**. Diferentes colaboradores têm diferentes direitos de acesso, e as respostas devem identificar suas fontes. A organização quer **evitar retreinar o modelo a cada atualização de política**. Qual arquitetura é a mais adequada?

- **A.** Continuar o pré-treinamento a cada nova versão de política, mantendo verificações de acesso separadas no portal do colaborador.
- **B.** Armazenar todas as políticas em um único system prompt longo e atualizá-lo sempre que as políticas mudarem.
- **C.** Fazer fine-tuning do assistente com exemplos aprovados de perguntas e respostas sobre as políticas e pedir que ele inclua citações nas respostas.
- **D.** Usar RAG com metadados dos documentos, recuperação com controle de acesso e respostas fundamentadas nas fontes.

### Q5 — Continuidade Entre Sessões

Um assistente de atendimento ao cliente deve lembrar, em sessões futuras, a **preferência de contato explicitamente aprovada** por um cliente. A empresa também precisa **corrigir ou excluir essa preferência** sem retreinar o modelo. Qual abordagem atende melhor aos dois requisitos?

- **A.** Incluir a preferência na conversa atual e confiar na janela de contexto do modelo para preservá-la em sessões futuras.
- **B.** Armazenar a preferência em um registro de memória externa, com controles de atualização/exclusão, e recuperá-la quando relevante.
- **C.** Incorporar a preferência ao modelo por meio de fine-tuning periódico com históricos de conversas.
- **D.** Manter indefinidamente todas as transcrições de conversas e colar o histórico completo em cada nova requisição.

### Q6 — Quando a Adaptação do Modelo se Justifica

Uma empresa já testou templates de prompt e RAG com um modelo existente. Ela possui exemplos rotulados confiáveis do **comportamento de entrada–saída** exigido, mas o modelo ainda **falha consistentemente em seguir um protocolo de resposta especializado**. A empresa está disposta a atualizar os pesos do modelo. Qual abordagem de treinamento ataca esse problema de forma mais direta?

- **A.** Pré-treinamento continuado com uma ampla coleção de relatórios setoriais não rotulados.
- **B.** Treinar um novo modelo de fundação do zero.
- **C.** Fine-tuning supervisionado com exemplos curados do comportamento de entrada–saída exigido.
- **D.** Expandir o índice de recuperação com mais documentos de referência, sem alterar o modelo.

### Q7 — Executando Ações com Segurança

Um assistente de compras consegue ler preços de fornecedores e preparar pedidos de compra. A diretoria quer que ele **prepare e envie pedidos rotineiros de forma autônoma**, mas **nenhum pedido acima de €10.000 pode ser enviado sem aprovação humana**. Qual implementação garante melhor esse requisito?

- **A.** Permitir que o modelo chame a API de pedidos, mas instruí-lo no prompt a buscar aprovação para pedidos grandes.
- **B.** Permitir que o modelo redija e envie pedidos; revisar os logs posteriormente e reverter qualquer compra fora da regra.
- **C.** Usar um modelo de raciocínio avançado com acesso completo à API de pedidos; avaliar sua conformidade antes da produção.
- **D.** Permitir que o modelo prepare pedidos, mas aplicar o limite de aprovação de €10.000 na aplicação, antes que qualquer ferramenta de envio seja executada.

### Q8 — Qualidade vs. Quantidade de Contexto

Um assistente interno de análise recebe centenas de documentos recuperados, incluindo **procedimentos desatualizados e versões contraditórias**. Embora caibam na janela de contexto do modelo, suas respostas se tornaram inconsistentes. Qual intervenção ataca a falha de forma mais direta?

- **A.** Recuperar e priorizar trechos relevantes, oficiais e atualizados usando metadados e filtros; em seguida, testar a qualidade das respostas.
- **B.** Aumentar o limite da janela de contexto para que o assistente possa receber ainda mais material.
- **C.** Fazer fine-tuning do modelo com toda a coleção de documentos antes de avaliar quais documentos são oficiais.
- **D.** Aumentar a aleatoriedade da geração para incentivar o modelo a explorar diferentes interpretações.

## Difíceis (Questões 9–10)

### Q9 — Escolhendo um Desenho de Orquestração

Uma seguradora está automatizando o processamento de sinistros. **Todo sinistro precisa passar pelas mesmas verificações obrigatórias de elegibilidade, fraude e aprovação de pagamento, em uma ordem fixa e auditável.** Para um pequeno subconjunto de sinistros atípicos, o sistema também precisa **escolher quais evidências adicionais solicitar e qual ferramenta de investigação usar com base em achados intermediários**. Qual é o desenho mais adequado?

- **A.** Um agente de ponta a ponta escolhe a ordem de todas as verificações, inclusive as aprovações obrigatórias, para maximizar a flexibilidade.
- **B.** Um workflow fixo executa todas as verificações e usa as mesmas solicitações de evidências adicionais para todo sinistro atípico.
- **C.** Um workflow impõe as etapas e aprovações obrigatórias, enquanto um agente com escopo limitado pode selecionar passos de investigação dentro de um ramo de exceção controlado.
- **D.** Um sistema multiagente atribui cada controle obrigatório a um agente diferente, e os agentes decidem coletivamente se um sinistro pode seguir adiante.

### Q10 — Diagnosticando e Aprimorando um Sistema de GenAI

Um assistente financeiro de GenAI combina RAG interno, ferramentas de banco de dados e um agente de investigação. Em um piloto, usuários relatam **números plausíveis, porém incorretos**, **solicitações ocasionais de ferramentas não autorizadas** e **resultados inconsistentes em casos semelhantes**. A diretoria precisa de um **plano de melhoria mensurável antes de escalar**. Qual proposta é a mais forte?

- **A.** Migrar para um modelo mais capaz, comparar a satisfação geral dos usuários e manter inalterados as permissões de ferramentas e o pipeline de recuperação atuais.
- **B.** Adicionar um system prompt mais forte e mais documentos recuperados e, então, monitorar se as reclamações diminuem após a implantação.
- **C.** Fazer fine-tuning com respostas corrigidas, adiando para depois do lançamento as mudanças nas permissões de ferramentas e o rastreamento sistemático.
- **D.** Construir casos de teste e métricas representativos, inspecionar os traces de recuperação e execução, verificar os números, impor permissões de ferramentas e iterar com base nos modos de falha medidos.

---

# Parte II — Gabarito do Instrutor e Validação Questão a Questão

## Resumo

| Questão | Dificuldade | Correta | Objetivo de aprendizagem |
|:--|:--|:--:|:--|
| Q1 | Fácil | **B** | Reutilizar e avaliar um modelo de fundação antes de investir em treinamento |
| Q2 | Fácil | **A** | Engenharia de prompt como intervenção de baixo custo e reversível |
| Q3 | Fácil | **C** | Adequar as capacidades multimodais aos requisitos reais de entrada/saída |
| Q4 | Média | **D** | RAG, permissões, atualidade e fundamentação em fontes |
| Q5 | Média | **B** | Memória persistente com governança e exclusão |
| Q6 | Média | **C** | Quando o fine-tuning supervisionado se justifica |
| Q7 | Média | **D** | Imposição externa da autorização de ações |
| Q8 | Média | **A** | Engenharia de contexto: relevância e autoridade acima de volume |
| Q9 | Difícil | **C** | Orquestração híbrida de workflow com agente de escopo limitado |
| Q10 | Difícil | **D** | Avaliação e melhoria baseadas em evidências, no nível do sistema |

## Q1 — Validação: B

**Por que B está correta:** Um único modelo de fundação existente pode atender a várias tarefas. A empresa pode primeiro avaliar seu desempenho real nos três usos pretendidos e investir apenas nas adaptações que se mostrarem necessárias. Isso atende diretamente à disciplina de custos e à restrição de ainda não fazer treinamento especializado.

**Por que as demais alternativas não atendem aos requisitos apresentados:**

- **A:** Modelos dedicados podem ser adequados mais tarde, mas exigem conjuntos de dados separados e investimento em treinamento antes de validar a demanda e a adequação.
- **C:** O pré-treinamento continuado é uma estratégia legítima de adaptação, mas gera custo de treinamento antes da prova de conceito solicitada.
- **D:** O desempenho em uma tarefa não comprova o desempenho nas outras duas, portanto não atende ao objetivo de avaliar múltiplos casos de uso.

**Verificação de unicidade:** As expressões **“orçamento limitado”** e **“antes de investir em treinamento especializado”** eliminam A e C; a avaliação das três tarefas distintas elimina D. **Apenas B atende a todas as restrições.**

## Q2 — Validação: A

**Por que A está correta:** Estrutura explícita, restrições, exemplos e teste dos resultados atacam a variabilidade de formato e tom; alterar um template de prompt é rápido, reversível e não modifica os pesos.

- **B:** O SFT poderia melhorar a aderência, mas modifica os pesos e não é a primeira intervenção de baixo custo e reversível.
- **C:** Mais contexto não padroniza diretamente o formato, e material adicional pode introduzir distração.
- **D:** RAG ajuda com conhecimento ausente ou atualizado; o cenário afirma que a precisão do conteúdo já é, em geral, boa e que o problema é a consistência da apresentação.

**Verificação de unicidade:** O cenário isola um problema de **formato/consistência** e exige explicitamente **nenhuma atualização de pesos** e um primeiro passo **rápido e reversível**. **Apenas A atende aos três.**

## Q3 — Validação: C

**Por que C está correta:** A tarefa exige compreensão conjunta de entrada visual e textual, seguida de uma resposta escrita. Trata-se de um requisito multimodal de entrada imagem + texto.

- **A:** Gerar imagens a partir de texto não comprova a capacidade de compreender imagens de produtos enviadas.
- **B:** OCR, sozinho, pode ler rótulos, mas não avalia adequadamente danos visuais ao produto.
- **D:** A transcrição de fala é útil para reclamações faladas, mas não é a modalidade de entrada descrita.

**Verificação de unicidade:** O enunciado define **fotografias + descrições escritas** como entradas e **texto** como saída. **Apenas C atende ao padrão completo de entrada/saída exigido.**

## Q4 — Validação: D

**Por que D está correta:** RAG pode recuperar as políticas vigentes sem atualizar os pesos do modelo. Metadados e recuperação com controle de acesso dão suporte ao versionamento de políticas e às permissões, enquanto respostas fundamentadas nas fontes permitem a verificação.

- **A:** O pré-treinamento continuado pode ensinar padrões do domínio, mas não reflete de forma eficiente cada atualização de política nem garante, por si só, respostas fundamentadas em fontes.
- **B:** Um prompt estático e extenso é difícil de manter, corre o risco de incluir conteúdo não autorizado e lida mal com coleções de documentos crescentes.
- **C:** O SFT pode melhorar o seguimento de instruções, mas não garante detalhes atualizados das políticas, permissões nem citações genuínas.

**Verificação de unicidade:** Os requisitos combinados são **atualizações frequentes, acesso diferenciado, fontes verificáveis e ausência de retreinamento recorrente**. **Apenas D atende explicitamente aos quatro.** RAG, em si, não é um sistema de autorização; as permissões precisam ser impostas na recuperação e no código ao redor.

## Q5 — Validação: B

**Por que B está correta:** Uma memória externa estruturada persiste entre requisições independentes e permite atualização e exclusão explícitas sem alterar os parâmetros aprendidos do modelo.

- **A:** O contexto existe apenas para a inferência atual; sessões futuras independentes não o retêm por padrão.
- **C:** Fine-tuning é inadequado para preferências individuais mutáveis e não oferece exclusão confiável por registro.
- **D:** Armazenar transcrições pode preservar o histórico, mas reenviá-lo indiscriminadamente é custoso e não oferece controles claros de correção/exclusão no nível da preferência, como exigido.

**Verificação de unicidade:** A exigência de **persistência com correção/exclusão controladas sem retreinamento** exclui A, C e D, tal como descritas. **Apenas B atende ao requisito completo.**

## Q6 — Validação: C

**Por que C está correta:** A organização possui exemplos rotulados confiáveis do comportamento de entrada–saída desejado e quer modificar os pesos para melhorar a aderência consistente ao protocolo. Esse é o caso de uso direto do SFT.

- **A:** O pré-treinamento continuado geralmente aprende a partir de material de domínio não rotulado e não é tão diretamente voltado ao comportamento de resposta rotulado.
- **B:** Construir um modelo de fundação do zero é desnecessário e desproporcional em comparação a adaptar um modelo existente.
- **D:** Mais documentos podem ajudar na fundamentação factual, mas não treinam diretamente a aderência consistente a um protocolo de resposta, sobretudo depois que RAG já foi avaliado.

**Verificação de unicidade:** O cenário estabelece explicitamente que **prompting e RAG já foram testados**, que existem **exemplos rotulados de comportamento** e que **atualizações de pesos são permitidas**. **Apenas C ataca diretamente esse problema residual.**

## Q7 — Validação: D

**Por que D está correta:** A aplicação pode deixar o assistente redigir os pedidos, mas deve impor o limite financeiro e a aprovação antes de executar uma ação de escrita. Trata-se de um controle de autorização externo, e não de uma promessa feita pelo modelo.

- **A:** Instruções no prompt, sozinhas, não conseguem impor de forma confiável um limite de autorização.
- **B:** Logs posteriores são valiosos para auditoria, mas não impedem uma compra não autorizada.
- **C:** Maior capacidade do modelo e avaliação pré-implantação podem reduzir erros, mas não substituem controles transacionais obrigatórios.

**Verificação de unicidade:** O requisito é que **nenhum pedido acima do limite seja enviado sem aprovação**. **Apenas D posiciona a imposição antes da execução.**

## Q8 — Validação: A

**Por que A está correta:** Selecionar, filtrar e ranquear trechos oficiais e atualizados ataca diretamente o contexto contraditório e desatualizado. Medir a qualidade das respostas valida a intervenção.

- **B:** Janelas maiores podem admitir mais informação irrelevante ou conflitante, em vez de resolver conflitos de autoridade.
- **C:** Treinar com documentos contraditórios e não filtrados pode reproduzir a mesma ambiguidade e acrescenta custo desnecessário.
- **D:** Maior aleatoriedade altera a variação das respostas, não a confiabilidade ou a autoridade das evidências.

**Verificação de unicidade:** O problema é a **qualidade do contexto apesar de capacidade suficiente**, e não o tamanho da janela. **Apenas A resolve diretamente relevância, autoridade de versão e qualidade das evidências.**

## Q9 — Validação: C

**Por que C está correta:** Etapas de workflow definidas em código preservam as verificações obrigatórias e uma ordem auditável. Dentro de um ramo de exceção limitado, um agente pode escolher passos adicionais de investigação com base nas observações. Execução multiagente não é requisito para comportamento agêntico.

- **A:** O controle de ponta a ponta por um agente conflita com a ordem fixa obrigatória de verificações e aprovações.
- **B:** Um caminho de exceção estritamente uniforme não consegue selecionar evidências e ferramentas dinamicamente, como o cenário exige.
- **D:** Múltiplos agentes não garantem, por si só, ordem fixa, auditabilidade ou controles humanos/de governança obrigatórios; decisões coletivas de agentes não substituem esses requisitos.

**Verificação de unicidade:** Há **duas restrições simultâneas** — controles determinísticos obrigatórios e investigação flexível de exceções. **Apenas C preserva explicitamente ambas.**

## Q10 — Validação: D

**Por que D está correta:** Um processo mensurável de melhoria do sistema distingue causas por meio de avaliações representativas e traces de execução; verificações de fontes e de cálculos tratam os números incorretos; permissões restringem ações inseguras; testes repetíveis avaliam a consistência.

- **A:** Um modelo mais capaz é um experimento possível, mas a simples troca de modelo deixa sem tratamento as falhas de recuperação e de autorização e mede um resultado estreito demais.
- **B:** Prompts e mais documentos podem ajudar em alguns problemas, mas podem piorar a qualidade do contexto e não impõem permissões nem estabelecem uma linha de base rigorosa de avaliação.
- **C:** SFT poderia ajudar em alguns padrões de resposta, mas adiar a imposição de permissões e o diagnóstico baseado em traces deixa riscos operacionais conhecidos sem solução antes de escalar.

**Verificação de unicidade:** O piloto apresenta **três classes distintas de falha**, e a diretoria exige explicitamente **evidências mensuráveis antes de escalar**. **Apenas D combina diagnóstico, controles e avaliação para as três.**

---

# Auditoria de Qualidade do Instrutor

**Checklist aplicado a cada questão:** (1) O enunciado apresenta um problema de negócio executivo. (2) Todas as quatro alternativas são estratégias ou tecnologias plausíveis, e não conceitos aleatórios, exceto quando um discriminador mais simples é apropriado. (3) A alternativa correta atende a todas as restrições explícitas. (4) Cada distrator falha em pelo menos uma restrição explícita. (5) A explicação identifica a restrição exata que distingue a resposta; nenhum distrator é rejeitado apenas por outra alternativa estar mais na moda.

| Questão | Principal tensão de decisão | Por que uma segunda resposta não é defensável sob as restrições apresentadas |
|:--|:--|:--|
| Q1 | Reutilização de modelo vs. investimento especializado prematuro | As demais estratégias exigem treinamento antecipado ou não testam todas as tarefas |
| Q2 | Prompting vs. treinamento e conhecimento adicional | Apenas o template de prompt é rápido, reversível, focado em formato e preserva os pesos |
| Q3 | Compreensão de imagem vs. modalidades adjacentes | Apenas uma alternativa atende ao requisito completo de entrada imagem + texto |
| Q4 | Atualidade vs. treinabilidade vs. acesso | Apenas RAG com controle de acesso atende explicitamente a todos os requisitos em conjunto |
| Q5 | Contexto atual vs. memória persistente governada | Apenas a memória externa gerenciada oferece registros editáveis e excluíveis entre sessões |
| Q6 | SFT vs. pré-treinamento continuado vs. RAG | Apenas o SFT aprende diretamente com o comportamento de resposta desejado e rotulado |
| Q7 | Garantias do modelo vs. autorização preventiva | Apenas o bloqueio no lado da aplicação impede envios proibidos |
| Q8 | Volume vs. contexto oficial | Apenas seleção/filtragem trata fontes desatualizadas e contraditórias |
| Q9 | Sequência obrigatória vs. investigação adaptativa | Apenas a orquestração híbrida oferece controles fixos e investigação dinâmica |
| Q10 | Otimização pontual vs. falhas observadas no sistema | Apenas testes, traces, validação e permissões no nível do sistema cobrem todas as falhas citadas |

**Nota sobre dificuldade:** A dificuldade é qualitativa, e não calibrada psicometricamente. Q1–Q3 estabelecem o julgamento fundamental, Q4–Q8 exigem escolher entre intervenções próximas, e Q9–Q10 exigem decisões de arquitetura e governança com múltiplas restrições. Aplique o quiz a um pequeno grupo piloto se for necessária calibração estatística.

**Alinhamento com as fontes (slides do curso):** A Aula 4 aborda Modelos de Fundação, transfer learning, pré-treinamento e pós-treinamento; a Aula 5 aborda engenharia de prompt, multimodalidade, memória, chamada de ferramentas, contexto e limitações; as Aulas 6–7 abordam harnesses, engenharia de contexto, RAG, execução de ferramentas, orquestração, guardrails, avaliações, observabilidade e o ciclo de melhoria do sistema.

**Recomendação ao instrutor:** Para uma avaliação aplicada aos alunos, distribua **apenas a Parte I**. Mantenha a **Parte II** como gabarito privado e registro de validação.
