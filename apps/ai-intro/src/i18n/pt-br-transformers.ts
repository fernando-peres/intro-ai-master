/** Brazilian Portuguese copy for the Transformers group (Architecture, Pretraining, Post-training). */
export const ptBRTransformers: Record<string, string> = {
  // Shared chrome
  Theory: "Teoria",
  Lab: "Laboratório",
  real: "real",
  simulation: "simulação",
  "historical illustration": "ilustração histórica",
  "conceptual illustration": "ilustração conceitual",
  "toy model": "modelo de brinquedo",

  // Architecture: hero, rail and lab
  Transformers: "Transformers",
  "the architecture": "a arquitetura",
  "GPT-2, GPT-3 and ChatGPT are all Transformers. Read what that architecture is in Theory, then watch GPT-2's attention at work in the Lab.":
    "GPT-2, GPT-3 e ChatGPT são todos Transformers. Leia o que é essa arquitetura em Teoria e depois veja a atenção do GPT-2 em ação no Laboratório.",
  Example: "Exemplo",
  Custom: "Personalizado",
  "Text A": "Texto A",
  "Text B (optional)": "Texto B (opcional)",
  "Text B": "Texto B",
  "Where to look": "Onde olhar",
  Layer: "Camada",
  "Previous layer": "Camada anterior",
  "Next layer": "Próxima camada",
  Head: "Cabeça",
  "Previous head": "Cabeça anterior",
  "Next head": "Próxima cabeça",
  "Mean of heads": "Média das cabeças",
  "Inspecting…": "Inspecionando…",
  Inspect: "Inspecionar",
  "Layer changed: press Inspect.": "A camada mudou: pressione Inspecionar.",
  Attention: "Atenção",
  "Running {0}…": "Executando {0}…",
  "Press Inspect to run {0} on the text.": "Pressione Inspecionar para executar {0} no texto.",
  "Attention weights are one window into the model, not an explanation of its reasoning: a head can put weight on a token for reasons that have nothing to do with meaning, and the feed-forward layers do work the heatmap cannot show.":
    "Os pesos de atenção são uma janela para o modelo, não uma explicação do seu raciocínio: uma cabeça pode dar peso a um token por razões que nada têm a ver com significado, e as camadas feed-forward fazem um trabalho que o mapa de calor não mostra.",
  "Attention · layer {0} · {1}": "Atenção · camada {0} · {1}",
  "mean of heads": "média das cabeças",
  "head {0}": "cabeça {0}",
  "Rows are the token looking (query); columns are the tokens looked at (key). Hatched cells are the future, masked out.":
    "As linhas são o token que olha (query); as colunas, os tokens olhados (key). As células hachuradas são o futuro, mascarado.",
  "Rows are the token looking (query); columns are the tokens looked at (key). No mask: an encoder's tokens see the whole sentence, both ways.":
    "As linhas são o token que olha (query); as colunas, os tokens olhados (key). Sem máscara: os tokens de um codificador veem a frase inteira, nos dois sentidos.",
  "What “{0}” attends to": "A que “{0}” presta atenção",
  "position {0}": "posição {0}",
  "Next token after the last position": "Próximo token após a última posição",
  "The last block's output for the final token, turned into probabilities. Generate from them in":
    "A saída do último bloco para o token final, convertida em probabilidades. Gere a partir delas em",
  "Next Token": "Próximo token",
  "GPT-2 · decoder": "GPT-2 · decodificador",
  "BERT small · encoder": "BERT small · codificador",
  "River bank vs. money bank": "Margem do rio vs. banco de dinheiro",
  "The cat sat on the": "The cat sat on the",
  "The cat sat on the mat": "The cat sat on the mat",
  "Select “bank” in both texts and step through the heads: at layer 5, head 6 ties “bank” to “river”. Averaged, most heads pile onto the first token, a known attention sink. The money sentence only links “bank” to “money” late, at layer 11.":
    "Selecione “bank” nos dois textos e percorra as cabeças: na camada 5, a cabeça 6 liga “bank” a “river”. Na média, a maioria das cabeças se concentra no primeiro token, um conhecido sumidouro de atenção. A frase do dinheiro só liga “bank” a “money” tarde, na camada 11.",
  "No mask: “bank” can look ahead at “river”. At layer 0, head 4 ties it to “river” in one sentence and to “money” in the other, the same head doing both. Every row sums to 1 over the whole sentence, [CLS] and [SEP] included.":
    "Sem máscara: “bank” pode olhar adiante para “river”. Na camada 0, a cabeça 4 liga a palavra a “river” numa frase e a “money” na outra, a mesma cabeça fazendo as duas coisas. Cada linha soma 1 sobre a frase inteira, [CLS] e [SEP] incluídos.",

  // Architecture: theory
  "An architecture, not a model": "Uma arquitetura, não um modelo",
  "The Transformer (Vaswani et al., 2017) is a way of wiring a neural network so that every token can look at other tokens through attention. GPT is one family of models built on its decoder half; ChatGPT is one of those models after post-training. The architecture, the trained weights and the training recipe are three different things.":
    "O Transformer (Vaswani et al., 2017) é uma forma de conectar uma rede neural para que cada token possa olhar para outros tokens por meio da atenção. GPT é uma família de modelos construída sobre a metade decodificadora; o ChatGPT é um desses modelos após o pós-treino. A arquitetura, os pesos treinados e a receita de treino são três coisas diferentes.",
  "GPT-3 → InstructGPT → GPT-3.5-era ChatGPT: conceptual evolution":
    "GPT-3 → InstructGPT → ChatGPT da era GPT-3.5: evolução conceitual",
  Milestone: "Marco",
  Year: "Ano",
  "Main contribution": "Principal contribuição",
  "Attention-based architecture with an encoder and a decoder":
    "Arquitetura baseada em atenção com um codificador e um decodificador",
  "Large decoder-only model trained to predict the next token":
    "Modelo grande só de decodificador treinado para prever o próximo token",
  "Scaling, and strong few-shot learning from examples in the prompt":
    "Escala e forte aprendizado few-shot a partir de exemplos no prompt",
  "Instruction following through SFT, a reward model and RLHF":
    "Seguir instruções por meio de SFT, um modelo de recompensa e RLHF",
  "Conversational, instruction-following assistant":
    "Assistente conversacional que segue instruções",
  Transformer: "Transformer",
  "GPT-2": "GPT-2",
  "GPT-3": "GPT-3",
  InstructGPT: "InstructGPT",
  "GPT-3.5 / ChatGPT": "GPT-3.5 / ChatGPT",
  "OpenAI described ChatGPT's training as supervised fine-tuning on dialogue, then a reward model and PPO-based RLHF. The full training history of the GPT-3.5 family is not public, so this course teaches the published method, not an exact reproduction.":
    "A OpenAI descreveu o treino do ChatGPT como ajuste fino supervisionado em diálogos, depois um modelo de recompensa e RLHF com PPO. O histórico completo de treino da família GPT-3.5 não é público, então este curso ensina o método publicado, não uma reprodução exata.",
  "Three variants": "Três variantes",
  "Typical uses": "Usos típicos",
  "Encoder-only": "Só codificador",
  "Decoder-only": "Só decodificador",
  "Encoder–decoder": "Codificador–decodificador",
  "Bidirectional self-attention: every token sees the whole input":
    "Autoatenção bidirecional: cada token vê a entrada inteira",
  "Causal self-attention: a token sees only what came before it":
    "Autoatenção causal: um token só vê o que veio antes dele",
  "Encoder self-attention, decoder causal attention, plus cross-attention to the encoder":
    "Autoatenção no codificador, atenção causal no decodificador e atenção cruzada ao codificador",
  "Classification, extraction, representations": "Classificação, extração, representações",
  "Text generation and completion; assistants after post-training":
    "Geração e continuação de texto; assistentes após o pós-treino",
  "Translation, summarization, text-to-text tasks": "Tradução, resumo, tarefas texto-para-texto",
  "An encoder can use words on both sides of a token. A causal decoder cannot see the future, which is exactly what lets it be trained to predict the next token. The Lab runs both: GPT-2 as the decoder, a small BERT as the encoder.":
    "Um codificador pode usar as palavras dos dois lados de um token. Um decodificador causal não vê o futuro, e é exatamente isso que permite treiná-lo para prever o próximo token. O Laboratório executa os dois: o GPT-2 como decodificador e um BERT pequeno como codificador.",
  "Inside a block": "Dentro de um bloco",
  "Each token enters as a vector (its embedding plus position). A block does two things to every token, then the next block repeats them. GPT-2 small has 12 blocks with 12 attention heads each.":
    "Cada token entra como um vetor (seu embedding mais a posição). Um bloco faz duas coisas com cada token, e o bloco seguinte as repete. O GPT-2 small tem 12 blocos com 12 cabeças de atenção cada.",
  "mixes information between tokens. Each token makes a query Q, a key K and a value V from its vector; the query is compared with every key, and the resulting weights decide how much of each value flows in.":
    "mistura informação entre tokens. Cada token produz uma consulta Q, uma chave K e um valor V a partir do seu vetor; a consulta é comparada com todas as chaves, e os pesos resultantes decidem quanto de cada valor entra.",
  "Feed-forward": "Feed-forward",
  "transforms each token on its own with a small two-layer network, the same one for every position.":
    "transforma cada token isoladamente com uma pequena rede de duas camadas, a mesma para todas as posições.",
  "M is the mask: 0 where a token may look, −∞ where it may not. In a decoder it hides every later position, so the weights above the diagonal are exactly zero. The last block's output goes through one more matrix to become a score per vocabulary word; softmax turns those into the next-token probabilities you saw in":
    "M é a máscara: 0 onde um token pode olhar, −∞ onde não pode. Num decodificador ela esconde todas as posições posteriores, então os pesos acima da diagonal são exatamente zero. A saída do último bloco passa por mais uma matriz e vira uma pontuação por palavra do vocabulário; a softmax as transforma nas probabilidades do próximo token que você viu em",
  "Where the labs fit": "Onde os laboratórios se encaixam",
  "The same decoder runs in two modes. Training changes the weights; inference uses them without changing them.":
    "O mesmo decodificador funciona em dois modos. O treino muda os pesos; a inferência os usa sem mudá-los.",
  Inference: "Inferência",
  "Known target tokens": "Tokens-alvo conhecidos",
  "Future tokens unknown": "Tokens futuros desconhecidos",
  "Forward pass and backward pass": "Passagem direta e passagem reversa",
  "Forward pass only": "Só passagem direta",
  "Loss and optimizer": "Perda e otimizador",
  "Decoding strategy (greedy, sampling, temperature)":
    "Estratégia de decodificação (gulosa, amostragem, temperatura)",
  "Parameters change": "Os parâmetros mudam",
  "Parameters stay fixed": "Os parâmetros ficam fixos",
  "Every position predicted in parallel": "Todas as posições previstas em paralelo",
  "One token at a time, appended to the context": "Um token por vez, acrescentado ao contexto",
  "this lesson's Lab inspects GPT-2's attention, layer by layer and head by head.":
    "o Laboratório desta aula inspeciona a atenção do GPT-2, camada por camada e cabeça por cabeça.",
  "generates one token at a time from the probabilities the last block produces.":
    "gera um token por vez a partir das probabilidades que o último bloco produz.",
  "Post-training": "Pós-treino",
  "collects the demonstrations and preferences that SFT and RLHF train on, and":
    "coleta as demonstrações e preferências com que SFT e RLHF treinam, e",
  "GPT → ChatGPT": "GPT → ChatGPT",
  "shows the before and after on one input.": "mostra o antes e o depois numa mesma entrada.",
  "The Transformer is the architecture. GPT is one model family built on its decoder. Pretraining, post-training and inference are things you do with it.":
    "O Transformer é a arquitetura. GPT é uma família de modelos construída sobre o seu decodificador. Pré-treino, pós-treino e inferência são coisas que se fazem com ela.",
  "Open the lab": "Abrir o laboratório",

  // Architecture: variants diagram
  "Three stacks: an encoder (self-attention then feed-forward), a decoder (causal attention then feed-forward, ending in next-token logits) and an encoder–decoder whose decoder also cross-attends to the encoder.":
    "Três pilhas: um codificador (autoatenção e depois feed-forward), um decodificador (atenção causal e depois feed-forward, terminando nos logits do próximo token) e um codificador–decodificador cujo decodificador também faz atenção cruzada ao codificador.",
  "Input vectors": "Vetores de entrada",
  "Self-attention": "Autoatenção",
  "Output vectors": "Vetores de saída",
  "Causal attention": "Atenção causal",
  "Next-token logits": "Logits do próximo token",
  "Source tokens": "Tokens de origem",
  Encoder: "Codificador",
  "Target so far": "Alvo até aqui",
  "Cross-attention": "Atenção cruzada",
  "Output tokens": "Tokens de saída",
  "Conceptual only: residual connections, normalization and the layer repeats are omitted.":
    "Apenas conceitual: conexões residuais, normalização e as repetições de camadas foram omitidas.",

  // Architecture: heatmap and calculator
  "Query token": "Token de consulta",
  "Attention of “{0}” in {1}: strongest on “{2}”": "Atenção de “{0}” em {1}: mais forte em “{2}”",
  "Q · K · V calculator": "Calculadora Q · K · V",
  "Edit the three token vectors X. Q = XW_Q, K = XW_K and V = XW_V use fixed projections; the weights are softmax(QKᵀ / √d_k + M) and the output is those weights times V.":
    "Edite os três vetores de token X. Q = XW_Q, K = XW_K e V = XW_V usam projeções fixas; os pesos são softmax(QKᵀ / √d_k + M) e a saída é esses pesos vezes V.",
  "Token vectors X": "Vetores de token X",
  "dimension {0}": "dimensão {0}",
  "Causal mask": "Máscara causal",
  "QKᵀ / √d_k": "QKᵀ / √d_k",
  "the toy example": "o exemplo de brinquedo",
  "Toy numbers you choose; no model involved. In GPT-2 each of the 12 heads in each of the 12 layers has its own W_Q, W_K and W_V, learned during pretraining, and d_k is 64.":
    "Números de brinquedo que você escolhe; nenhum modelo envolvido. No GPT-2, cada uma das 12 cabeças de cada uma das 12 camadas tem seus próprios W_Q, W_K e W_V, aprendidos no pré-treino, e d_k é 64.",

  // Pretraining
  Pretraining: "Pré-treino",
  "a GPT learns to predict": "um GPT aprende a prever",
  "A decoder-only Transformer, small enough to train on this laptop, learns one thing: the next token. Watch its loss fall, its guesses sharpen, and where it starts to memorise.":
    "Um Transformer só de decodificador, pequeno o bastante para treinar neste laptop, aprende uma coisa: o próximo token. Veja a perda cair, os palpites ficarem mais nítidos e onde ele começa a decorar.",
  "The previous run was lost (the server no longer has it), so a new one was started.":
    "A execução anterior foi perdida (o servidor não a tem mais), então uma nova foi iniciada.",
  "Train a few hundred steps and watch “Paris” climb in the training example. Then keep going: training loss keeps falling, but validation loss turns up. That is memorisation.":
    "Treine algumas centenas de passos e veja “Paris” subir no exemplo de treino. Depois continue: a perda de treino segue caindo, mas a perda de validação vira para cima. Isso é decorar.",
  Corpus: "Corpus",
  "checkpoint available": "checkpoint disponível",
  "Start from": "Começar de",
  "Random weights": "Pesos aleatórios",
  "Pretrained checkpoint": "Checkpoint pré-treinado",
  Seed: "Semente",
  "Previous seed": "Semente anterior",
  "Next seed": "Próxima semente",
  "The checkpoint fixes the weights; the seed only applies to random weights.":
    "O checkpoint fixa os pesos; a semente só se aplica a pesos aleatórios.",
  "{0} steps": "{0} passos",
  Auto: "Automático",
  "This run reached its step limit.": "Esta execução atingiu o limite de passos.",
  "This toy model has about 50 thousand parameters and reads a few thousand tokens; GPT-3 had 175 billion parameters and read hundreds of billions. The mechanism is the same. The capabilities are not.":
    "Este modelo de brinquedo tem cerca de 50 mil parâmetros e lê alguns milhares de tokens; o GPT-3 tinha 175 bilhões de parâmetros e leu centenas de bilhões. O mecanismo é o mesmo. As capacidades, não.",
  "Dataset statistics": "Estatísticas do conjunto de dados",
  Documents: "Documentos",
  "Duplicates removed": "Duplicatas removidas",
  Tokens: "Tokens",
  Vocabulary: "Vocabulário",
  "Train / validation": "Treino / validação",
  Context: "Contexto",
  "{0} tokens": "{0} tokens",
  "How the text is prepared": "Como o texto é preparado",
  "Cleaning: whitespace is normalised and empty documents dropped.":
    "Limpeza: os espaços são normalizados e documentos vazios são descartados.",
  "Deduplication: exact duplicates are removed, so no sentence counts twice.":
    "Deduplicação: duplicatas exatas são removidas, para nenhuma frase contar duas vezes.",
  "Tokenization: words and punctuation become tokens; a word keeps its leading space, like GPT-2's tokens.":
    "Tokenização: palavras e pontuação viram tokens; uma palavra guarda o espaço que a precede, como os tokens do GPT-2.",
  "Split: every tenth document goes to validation and is never trained on, so its loss measures generalisation.":
    "Divisão: um a cada dez documentos vai para validação e nunca entra no treino, então sua perda mede a generalização.",
  "Context windows: training samples random windows of {0} tokens; each window gives {0} next-token targets at once.":
    "Janelas de contexto: o treino sorteia janelas de {0} tokens; cada janela dá {0} alvos de próximo token de uma vez.",
  "Loading the corpora…": "Carregando os corpora…",
  "Training example": "Exemplo de treino",
  "Every position is a training example: the tokens so far are the context, the next token is the target. One causal forward pass scores all of them at once.":
    "Cada posição é um exemplo de treino: os tokens até ali são o contexto, o próximo token é o alvo. Uma única passagem causal pontua todos de uma vez.",
  "Text to probe": "Texto a sondar",
  Probe: "Sondar",
  Target: "Alvo",
  "p(target)": "p(alvo)",
  "Showing the last {0} tokens: the toy model's context window.":
    "Mostrando os últimos {0} tokens: a janela de contexto do modelo de brinquedo.",
  "After “{0}”, the model expects": "Depois de “{0}”, o modelo espera",
  "Target “{0}”: p = {1}, loss = −ln p = {2}": "Alvo “{0}”: p = {1}, perda = −ln p = {2}",
  "Training progress": "Progresso do treino",
  "Train loss": "Perda de treino",
  "Validation loss": "Perda de validação",
  Perplexity: "Perplexidade",
  Parameters: "Parâmetros",
  "cross-entropy loss": "perda de entropia cruzada",
  "training loss": "perda de treino",
  "validation loss": "perda de validação",
  "random guess, ln V": "palpite aleatório, ln V",
  "Validation loss is rising while training loss keeps falling: the model is memorising its training tokens instead of learning patterns that transfer. More data, not more steps, is the cure.":
    "A perda de validação está subindo enquanto a de treino segue caindo: o modelo está decorando seus tokens de treino em vez de aprender padrões que transferem. A cura é mais dados, não mais passos.",
  "Perplexity is e to the validation loss: roughly how many tokens the model is choosing between, while it stays below the vocabulary size V. Above V the model is confidently wrong on unseen text. A random guess scores ln V, the dashed line.":
    "A perplexidade é e elevado à perda de validação: aproximadamente entre quantos tokens o modelo está escolhendo, enquanto fica abaixo do tamanho do vocabulário V. Acima de V, o modelo erra com confiança em texto não visto. Um palpite aleatório marca ln V, a linha tracejada.",
  "Try the model": "Experimente o modelo",
  Prompt: "Prompt",
  "Generating…": "Gerando…",
  Generate: "Gerar",
  "Greedy decoding, up to 12 tokens. This measures behaviour, not loss: a model can have a low loss on its corpus and still answer a question badly. Compare with GPT-2 in":
    "Decodificação gulosa, até 12 tokens. Isto mede comportamento, não perda: um modelo pode ter perda baixa no seu corpus e ainda responder mal a uma pergunta. Compare com o GPT-2 em",
  Story: "História",
  Fact: "Fato",
  "General text": "Texto geral",
  Narrative: "Narrativa",
  Code: "Código",
  "Structured text": "Texto estruturado",
  Multilingual: "Multilíngue",
  "Noisy text": "Texto ruidoso",
  Everything: "Tudo",
  "Factual associations": "Associações factuais",
  "Continuation and style": "Continuação e estilo",
  "Syntax and code completion": "Sintaxe e completamento de código",
  "Patterns and formatting": "Padrões e formatação",
  "Language representations": "Representações de idiomas",
  "Duplicates, typos and inconsistent formatting":
    "Duplicatas, erros de digitação e formatação inconsistente",
  "All clean corpora together": "Todos os corpora limpos juntos",

  // Post-training: page and rail
  "from GPT to assistant": "do GPT ao assistente",
  "The pretrained toy GPT continues text. Three training stages, the ones InstructGPT and ChatGPT published, turn it into something that answers: demonstrations, human preferences, and reinforcement learning against a reward model.":
    "O GPT de brinquedo pré-treinado continua texto. Três estágios de treino, os que InstructGPT e ChatGPT publicaram, o transformam em algo que responde: demonstrações, preferências humanas e aprendizado por reforço contra um modelo de recompensa.",
  "Go down the page in order: SFT, then rank answers and train the reward model, then PPO. Try β = 0 to see the policy drift, and the longer-answers switch to see a reward model learn a bias.":
    "Desça a página em ordem: SFT, depois ordene respostas e treine o modelo de recompensa, depois PPO. Tente β = 0 para ver a política derivar, e a chave de respostas mais longas para ver um modelo de recompensa aprender um viés.",
  Run: "Execução",
  "Stage: {0} · {1} SFT steps · {2} PPO iterations":
    "Estágio: {0} · {1} passos de SFT · {2} iterações de PPO",
  "SFT checkpoint": "Checkpoint de SFT",
  "RLHF checkpoint": "Checkpoint de RLHF",
  "What changed and what did not: pretraining gave the toy its facts and its grammar; SFT gave it a format; the reward model turned rankings into a score; PPO moved the policy toward that score. None of these stages added knowledge. At GPT-3's scale the same recipe made existing capabilities reachable through plain instructions, which is why GPT-3.5 felt new.":
    "O que mudou e o que não mudou: o pré-treino deu ao brinquedo seus fatos e sua gramática; o SFT deu um formato; o modelo de recompensa transformou ordenações numa pontuação; o PPO moveu a política em direção a essa pontuação. Nenhum desses estágios acrescentou conhecimento. Na escala do GPT-3, a mesma receita tornou capacidades existentes alcançáveis por instruções simples, e por isso o GPT-3.5 pareceu novo.",

  // Post-training: SFT
  "Full fine-tuning": "Ajuste fino completo",
  "every weight moves": "todos os pesos mudam",
  "LoRA adapter (rank 4)": "Adaptador LoRA (posto 4)",
  "base frozen; small added matrices train":
    "base congelada; pequenas matrizes adicionadas treinam",
  "1 · Supervised fine-tuning": "1 · Ajuste fino supervisionado",
  "Demonstrations pair a prompt with the answer a person wrote. The model is trained to continue the prompt with that answer; the loss counts only the answer's tokens, never the prompt's.":
    "Demonstrações juntam um prompt à resposta que uma pessoa escreveu. O modelo é treinado para continuar o prompt com essa resposta; a perda conta só os tokens da resposta, nunca os do prompt.",
  "Human demonstration": "Demonstração humana",
  "and {0} more": "e mais {0}",
  "Loss mask": "Máscara da perda",
  "Demonstrated question": "Pergunta demonstrada",
  "p(“Madrid”) after “Answer:”": "p(“Madrid”) depois de “Answer:”",
  "Held-out question (never demonstrated)": "Pergunta reservada (nunca demonstrada)",
  "the model's top guess; p(“Rome”) = {0}": "o principal palpite do modelo; p(“Rome”) = {0}",
  "{0} of {1} parameters trained ({2}%)": "{0} de {1} parâmetros treinados ({2}%)",
  "Run 50 SFT steps": "Executar 50 passos de SFT",
  "{0} SFT steps so far": "{0} passos de SFT até agora",
  "Closed after PPO or DPO: reset the run to fine-tune again.":
    "Fechado após PPO ou DPO: reinicie a execução para ajustar de novo.",
  "SFT step": "passo de SFT",
  "loss on answer tokens": "perda nos tokens da resposta",
  demonstrations: "demonstrações",
  "held-out questions": "perguntas reservadas",
  "Pretraining already knows “The capital of Italy is Rome.” SFT teaches the question format from fifteen demonstrations, and the demonstrated questions are answered. Whether a held-out question reaches that knowledge is what scale buys: this toy mostly cannot, GPT-3 could. A pretraining batch is mixed into every SFT step so the model does not forget what it knew. With LoRA the base weights never move: rank-4 adapters on every block's linears learn the format with about a tenth of the parameters and are folded back into the weights afterwards. Even the new words' embeddings stay random; the adapters learn around them.":
    "O pré-treino já sabe “The capital of Italy is Rome.” O SFT ensina o formato de pergunta com quinze demonstrações, e as perguntas demonstradas são respondidas. Se uma pergunta reservada alcança esse conhecimento é o que a escala compra: este brinquedo quase nunca consegue, o GPT-3 conseguia. Um lote de pré-treino é misturado a cada passo de SFT para o modelo não esquecer o que sabia. Com LoRA os pesos da base nunca mudam: adaptadores de posto 4 nas camadas lineares de cada bloco aprendem o formato com cerca de um décimo dos parâmetros e depois são incorporados aos pesos. Até os embeddings das palavras novas continuam aleatórios; os adaptadores aprendem a contorná-los.",

  // Post-training: preferences and reward model
  "2 · Human preferences": "2 · Preferências humanas",
  "You are the annotator. Rank the four answers from best to worst; every ordered pair becomes a (chosen, rejected) example. The reward model then learns to predict your preferences, not the truth.":
    "Você é o anotador. Ordene as quatro respostas da melhor para a pior; cada par ordenado vira um exemplo (escolhida, rejeitada). O modelo de recompensa aprende então a prever suas preferências, não a verdade.",
  "1st": "1º",
  "2nd": "2º",
  "3rd": "3º",
  "4th": "4º",
  "Reset ranking": "Limpar ordenação",
  "Submit ranking": "Enviar ordenação",
  "{0} pairs from you": "{0} pares seus",
  "Prefer longer answers": "Preferir respostas mais longas",
  "The built-in rankings prefer concise, correct answers. The switch replaces them with an annotator who always ranks the longest answer first; your own pairs stay.":
    "As ordenações embutidas preferem respostas concisas e corretas. A chave as substitui por um anotador que sempre põe a resposta mais longa em primeiro; seus próprios pares permanecem.",
  "Train reward model (100 steps)": "Treinar modelo de recompensa (100 passos)",
  "{0} steps · agrees with {1}% of the pairs": "{0} passos · concorda com {1}% dos pares",
  "reward-model step": "passo do modelo de recompensa",
  "pairs ranked like the annotator": "pares ordenados como o anotador",
  Answer: "Resposta",
  "Reward-model score": "Pontuação do modelo de recompensa",
  "the reward model's favourite is the honest best":
    "a favorita do modelo de recompensa é a melhor honesta",
  "the reward model's favourite is not the honest best":
    "a favorita do modelo de recompensa não é a melhor honesta",
  "Scores are relative: only differences between answers to the same prompt mean anything. A reward model trained on a biased annotator is a faithful model of that bias.":
    "As pontuações são relativas: só as diferenças entre respostas ao mesmo prompt significam algo. Um modelo de recompensa treinado com um anotador enviesado é um modelo fiel desse viés.",
  "correct and concise": "correta e concisa",
  "correct but longer than asked": "correta, mas mais longa do que o pedido",
  "confident but wrong": "confiante, mas errada",
  irrelevant: "irrelevante",

  // Post-training: PPO
  "3 · RLHF with PPO": "3 · RLHF com PPO",
  "Each iteration the policy answers the six prompts, the reward model scores the answers, and PPO nudges the policy toward higher scores while a KL penalty keeps it close to the SFT weights.":
    "A cada iteração a política responde aos seis prompts, o modelo de recompensa pontua as respostas, e o PPO empurra a política para pontuações mais altas enquanto uma penalidade KL a mantém perto dos pesos do SFT.",
  "learning rate": "taxa de aprendizado",
  "Clip ε": "Clip ε",
  "clip ε": "clip ε",
  "KL penalty β": "Penalidade KL β",
  "KL β": "KL β",
  "Run 5 PPO iterations": "Executar 5 iterações de PPO",
  "This run took the DPO branch; reset it to try PPO.":
    "Esta execução seguiu o ramo DPO; reinicie para tentar PPO.",
  "Run SFT first: PPO needs those weights as its reference.":
    "Execute o SFT primeiro: o PPO precisa desses pesos como referência.",
  "Train a reward model first.": "Treine um modelo de recompensa primeiro.",
  "PPO iteration": "iteração de PPO",
  "mean reward-model score": "pontuação média do modelo de recompensa",
  reward: "recompensa",
  "KL to the SFT policy": "KL em relação à política do SFT",
  KL: "KL",
  Clipped: "Cortado",
  "Sample answer to “{0}”": "Resposta amostrada para “{0}”",
  "The latest sample repeats itself: the policy found an answer the reward model over-rates. That is reward hacking; the KL penalty is what limits it.":
    "A última amostra se repete: a política encontrou uma resposta que o modelo de recompensa superestima. Isso é reward hacking; a penalidade KL é o que o limita.",
  "With β = 0 nothing holds the policy near its reference: watch the KL climb.":
    "Com β = 0 nada segura a política perto da referência: veja a KL subir.",
  "What a reward model is meant to capture": "O que um modelo de recompensa deveria capturar",
  "Response behaviour": "Comportamento da resposta",
  "Illustrative reward": "Recompensa ilustrativa",
  "Clear, accurate, exactly two sentences": "Clara, correta, exatamente duas frases",
  "Correct but excessively long": "Correta, mas excessivamente longa",
  "Inaccurate but confident": "Incorreta, mas confiante",
  "Irrelevant answer": "Resposta irrelevante",
  "Invented teaching scores. Real reward-model scores are learned and not calibrated to this scale; the table above the chart shows the real ones here.":
    "Pontuações inventadas para ensino. As pontuações reais de um modelo de recompensa são aprendidas e não calibradas nesta escala; a tabela acima do gráfico mostra as reais aqui.",
  "Simplifications in this toy, stated plainly: one reward per whole answer, sequence-level PPO ratios, no value network, advantages standardised per batch, and the KL penalty added to the loss. InstructGPT scored the whole answer once as well, but subtracted a per-token KL penalty from the reward and learned a value head with GAE.":
    "Simplificações deste brinquedo, ditas com clareza: uma recompensa por resposta inteira, razões de PPO no nível da sequência, sem rede de valor, vantagens padronizadas por lote e a penalidade KL somada à perda. O InstructGPT também pontuava a resposta inteira uma vez, mas subtraía da recompensa uma penalidade KL por token e aprendia uma cabeça de valor com GAE.",

  // Post-training: DPO
  "3b · Direct Preference Optimization": "3b · Otimização direta de preferências (DPO)",
  "The modern shortcut: skip the reward model and PPO, and train the policy on the same preference pairs directly. The policy's own log-probabilities, relative to the SFT reference, act as the reward.":
    "O atalho moderno: pule o modelo de recompensa e o PPO e treine a política diretamente nos mesmos pares de preferência. As próprias log-probabilidades da política, relativas à referência do SFT, fazem o papel da recompensa.",
  β: "β",
  "Run 50 DPO steps": "Executar 50 passos de DPO",
  "This run took the PPO branch; reset it to try DPO.":
    "Esta execução seguiu o ramo PPO; reinicie para tentar DPO.",
  "Run SFT first: DPO needs those weights as its reference.":
    "Execute o SFT primeiro: o DPO precisa desses pesos como referência.",
  "{0} steps · agrees with {1}% of the pairs · margin {2}":
    "{0} passos · concorda com {1}% dos pares · margem {2}",
  "DPO step": "passo de DPO",
  "DPO loss": "perda de DPO",
  "Same data as the reward model, no separate model, no sampling loop: that is why DPO replaced PPO in many recipes after 2023. The catch: DPO raises the chosen answer relative to the rejected one, and the probability of both can fall, so a third answer sometimes wins greedy decoding. A run takes one branch, PPO or DPO; reset to try the other.":
    "Os mesmos dados do modelo de recompensa, nenhum modelo separado, nenhum laço de amostragem: por isso o DPO substituiu o PPO em muitas receitas depois de 2023. O porém: o DPO sobe a resposta escolhida em relação à rejeitada, e a probabilidade das duas pode cair, então uma terceira resposta às vezes vence a decodificação gulosa. Uma execução segue um ramo, PPO ou DPO; reinicie para tentar o outro.",

  // Post-training: compare and other techniques
  Pretrained: "Pré-treinado",
  "After SFT": "Após SFT",
  "After RLHF (current)": "Após RLHF (atual)",
  "After DPO (current)": "Após DPO (atual)",
  "After SFT (current)": "Após SFT (atual)",
  "Pretrained (current)": "Pré-treinado (atual)",
  "4 · Compare the checkpoints": "4 · Compare os checkpoints",
  "Generate from all stages": "Gerar de todos os estágios",
  "not reached yet": "ainda não alcançado",
  "One model at three points of its training, nothing else changed. Greedy decoding, so differences come from training, not sampling. Compare with GPT-2 against a real assistant in GPT → ChatGPT.":
    "Um modelo em três pontos do seu treino, nada mais mudou. Decodificação gulosa, então as diferenças vêm do treino, não da amostragem. Compare o GPT-2 com um assistente real em GPT → ChatGPT.",
  "Other techniques you will hear about": "Outras técnicas de que você vai ouvir falar",
  Technique: "Técnica",
  "What it does": "O que faz",
  "Relationship to the recipe above": "Relação com a receita acima",
  DPO: "DPO",
  "Optimises the policy directly on preference pairs":
    "Otimiza a política diretamente nos pares de preferência",
  "Replaces the reward model + PPO pair; same data as the reward model. Runnable above, in 3b":
    "Substitui a dupla modelo de recompensa + PPO; mesmos dados do modelo de recompensa. Executável acima, em 3b",
  "LoRA / PEFT": "LoRA / PEFT",
  "Trains small added matrices while the base weights stay frozen":
    "Treina pequenas matrizes adicionadas enquanto os pesos da base ficam congelados",
  "An efficiency method usable with SFT and with preference methods":
    "Um método de eficiência usável com SFT e com métodos de preferência",
  "Continued pretraining": "Pré-treino continuado",
  "Keeps next-token training on more text": "Continua o treino de próximo token em mais texto",
  "A separate adaptation stage, not instruction tuning":
    "Um estágio de adaptação à parte, não ajuste por instruções",
  "Rejection sampling": "Amostragem por rejeição",
  "Keeps the best of several sampled answers for further training":
    "Guarda a melhor entre várias respostas amostradas para treinar mais",
  "A data-selection step that can feed SFT":
    "Um passo de seleção de dados que pode alimentar o SFT",
  "None of these were stages of the original InstructGPT or ChatGPT pipeline, which was SFT → reward model → PPO.":
    "Nenhuma delas foi um estágio do pipeline original do InstructGPT ou do ChatGPT, que era SFT → modelo de recompensa → PPO.",

  // GPT → ChatGPT: toy lineage
  "Same lineage, toy scale": "Mesma linhagem, escala de brinquedo",
  "The three panels above compare different models. These three are one model at three points of its training: the Pretraining lesson's toy GPT before post-training, after SFT, and after a reward model plus PPO.":
    "Os três painéis acima comparam modelos diferentes. Estes três são um só modelo em três pontos do seu treino: o GPT de brinquedo da aula de Pré-treino antes do pós-treino, após o SFT e após um modelo de recompensa mais PPO.",
  "Toy prompt": "Prompt de brinquedo",
  "Running…": "Executando…",
  "Run the toy lineage": "Executar a linhagem de brinquedo",
  "Toy base": "Brinquedo base",
  "Toy after SFT": "Brinquedo após SFT",
  "Toy after RLHF": "Brinquedo após RLHF",
  "Train these stages yourself in Transformers › Post-training. The toy knows a few dozen facts, so ask it about those; a real assistant's breadth comes from pretraining at scale, not from post-training.":
    "Treine esses estágios você mesmo em Transformers › Pós-treino. O brinquedo sabe algumas dezenas de fatos, então pergunte sobre eles; a amplitude de um assistente real vem do pré-treino em escala, não do pós-treino.",
}
