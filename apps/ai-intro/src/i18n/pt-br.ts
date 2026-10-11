export const ptBR: Record<string, string> = {
  "What was learned — the trained network": "O que foi aprendido — a rede treinada",
  "Trained network weights and biases": "Pesos e vieses da rede treinada",
  "After {0} epochs, these are the learned parameters: each connection is labeled with its weight, and b beneath each neuron is its bias. Values are rounded to two decimal places. Together, weights and biases determine how the network combines the scaled sensor readings to make a prediction. This is the same trained model evaluated below.":
    "Após {0} épocas, estes são os parâmetros aprendidos: cada conexão indica seu peso, e b abaixo de cada neurônio é seu viés. Os valores são arredondados para duas casas decimais. Juntos, pesos e vieses determinam como a rede combina as leituras dos sensores em escala ajustada para fazer uma previsão. Este é o mesmo modelo treinado avaliado abaixo.",
  "A factory wants to identify machines that may need maintenance. Given temperature (°C) and vibration (mm/s), predict one of two labels: A — Normal or B — At Risk.":
    "Uma fábrica quer identificar máquinas que podem precisar de manutenção. A partir da temperatura (°C) e da vibração (mm/s), preveja um de dois rótulos: A — Normal ou B — Em risco.",
  "Each dot is one labeled observation. The two groups form interlocking curves: a single straight line cannot separate them.":
    "Cada ponto é uma observação rotulada. Os dois grupos formam curvas entrelaçadas: uma única reta não consegue separá-los.",
  "These are synthetic teaching examples, not real industrial safety thresholds.":
    "Estes são exemplos sintéticos para ensino, não limites reais de segurança industrial.",
  "One problem, two ways to solve it. Review the solutions, read their results, and learn what those results can—and cannot—tell us.":
    "Um problema, duas formas de resolvê-lo. Revise as soluções, interprete os resultados e entenda o que eles podem — e não podem — nos dizer.",
  "Humans write the decision logic. These rules flag high temperature, high vibration, or a combination of moderately high readings; everything else is classified as Normal.":
    "As pessoas escrevem a lógica de decisão. Estas regras sinalizam temperatura alta, vibração alta ou uma combinação de leituras moderadamente altas; todo o restante é classificado como Normal.",
  "The background shows the rules’ predictions; dots show the known labels. Dashed rings mark mistakes. These thresholds create rectangular regions that do not follow the curved pattern.":
    "O fundo mostra as previsões das regras; os pontos mostram os rótulos conhecidos. Círculos tracejados indicam erros. Esses limites criam regiões retangulares que não acompanham o padrão curvo.",
  "False alarm: at 88°C and 2.3 mm/s, the temperature rule predicts At Risk, but the example is Normal.":
    "Alarme falso: a 88°C e 2,3 mm/s, a regra de temperatura prevê Em risco, mas o exemplo é Normal.",
  "Missed risk: at 51°C and 5.1 mm/s, no rule fires, so the prediction is Normal, but the example is At Risk.":
    "Risco não detectado: a 51°C e 5,1 mm/s, nenhuma regra é acionada, então a previsão é Normal, mas o exemplo é Em risco.",
  "Better rules could improve this score. The limitation belongs to this particular solution, not to programming as a whole.":
    "Regras melhores poderiam aumentar essa pontuação. A limitação é desta solução específica, não da programação como um todo.",
  "Humans still write the training program and choose the inputs and model. Instead of specifying every decision rule, we use labeled examples to learn the network’s weights.":
    "As pessoas continuam escrevendo o programa de treino e escolhendo as entradas e o modelo. Em vez de especificar cada regra de decisão, usamos exemplos rotulados para aprender os pesos da rede.",
  "2 sensor inputs → 4 hidden neurons → 2 hidden neurons → 1 risk score":
    "2 entradas dos sensores → 4 neurônios ocultos → 2 neurônios ocultos → 1 pontuação de risco",
  "Hidden layers use tanh; the sigmoid output becomes At Risk at a threshold of 0.5.":
    "As camadas ocultas usam tanh; a saída sigmoide é classificada como Em risco a partir do limiar de 0,5.",
  Predict: "Prever",
  "Pass the readings through the network to produce a risk score.":
    "Passe as leituras pela rede para produzir uma pontuação de risco.",
  "Compare the score with the known label using cross-entropy loss.":
    "Compare a pontuação com o rótulo conhecido usando a perda de entropia cruzada.",
  Update: "Atualizar",
  "Backpropagation computes gradients; gradient descent adjusts the weights.":
    "A retropropagação calcula os gradientes; a descida do gradiente ajusta os pesos.",
  "Repeat over the examples, then evaluate separately on unseen data.":
    "Repita com os exemplos e depois avalie separadamente com dados inéditos.",
  "The learned boundary follows the curved pattern. Both this chart and the score come from the same trained network, using a fixed seed for a reproducible example.":
    "A fronteira aprendida acompanha o padrão curvo. Este gráfico e a pontuação vêm da mesma rede treinada, com uma semente fixa para tornar o exemplo reproduzível.",
  "Training accuracy is not test accuracy. The network learned from these same examples. No held-out test set is measured here, so performance on new machines is unknown.":
    "A acurácia de treino não é a acurácia de teste. A rede aprendeu com estes mesmos exemplos. Aqui não há medição em um conjunto de teste separado, então o desempenho em novas máquinas é desconhecido.",
  "Wrong labels": "Rótulos incorretos",
  "Imagine maintenance records mark faulty machines as Normal. Training rewards the model for repeating those errors.":
    "Imagine registros de manutenção que rotulem máquinas com defeito como Normal. O treino recompensa o modelo por repetir esses erros.",
  "Check: audit labels against reliable maintenance outcomes before training.":
    "Verificação: confira os rótulos com resultados confiáveis de manutenção antes de treinar.",
  "Too few representative examples": "Poucos exemplos representativos",
  "Imagine training only on cool machines. A high training score says little about hot machines; a flexible model may also fit accidental patterns (overfitting).":
    "Imagine treinar apenas com máquinas frias. Uma pontuação alta no treino diz pouco sobre máquinas quentes; um modelo flexível também pode ajustar padrões acidentais (sobreajuste).",
  "Check: collect examples across operating conditions and compare training results with a separate, representative test set.":
    "Verificação: reúna exemplos de diferentes condições de operação e compare os resultados de treino com um conjunto de teste separado e representativo.",
  "Changed operating conditions": "Mudança nas condições de operação",
  "Imagine a new machine type or a recalibrated sensor. The relationship between the readings and failure risk may change: this is distribution shift.":
    "Imagine um novo tipo de máquina ou um sensor recalibrado. A relação entre as leituras e o risco de falha pode mudar: isso é uma mudança de distribuição.",
  "Check: monitor errors on recent labeled data, investigate changes, and validate any retrained model before use.":
    "Verificação: monitore os erros em dados rotulados recentes, investigue as mudanças e valide qualquer modelo retreinado antes de usá-lo.",
  "Main takeaways": "Principais conclusões",
  "See it break — Learning patterns is not understanding":
    "Veja onde falha — Aprender padrões não é compreender",
  "Machine learning is not magic. These thought experiments show why even a perfect training score can be misleading.":
    "Aprendizado de máquina não é mágica. Estes cenários ilustrativos mostram por que até uma pontuação perfeita no treino pode enganar.",
  "Choose the approach that works on representative, unseen data. A perfect training score is not a guarantee—and machine learning does not automatically beat well-designed rules.":
    "Escolha a abordagem que funciona com dados representativos e inéditos. Uma pontuação perfeita no treino não é garantia — e o aprendizado de máquina não supera automaticamente regras bem elaboradas.",
  "Before trusting either solution: which is more costly here—a false alarm or a missed failure? Accuracy alone does not answer that question.":
    "Antes de confiar em qualquer solução: o que custa mais aqui — um alarme falso ou uma falha não detectada? A acurácia sozinha não responde a essa pergunta.",
  "{0} synthetic observations, shared by both approaches.":
    "{0} observações sintéticas, compartilhadas pelas duas abordagens.",
  "{0}/{1} correct · {2}% accuracy": "{0}/{1} corretas · {2}% de acurácia",
  "Training-data result after {0} epochs": "Resultado nos dados de treino após {0} épocas",
  "Accuracy = correct predictions ÷ total observations.":
    "Acurácia = previsões corretas ÷ total de observações.",
  "Result on the shared examples": "Resultado nos exemplos compartilhados",
  "Performance on unseen machines": "Desempenho em máquinas inéditas",
  "Not measured here": "Não medido aqui",
  "When useful": "Quando é útil",
  "Clear, stable rules you can specify and check":
    "Regras claras e estáveis que você consegue especificar e verificar",
  "Patterns that are hard to specify, with representative labeled data":
    "Padrões difíceis de especificar, com dados rotulados representativos",

  "Start with small, usually random weights.": "Comece com pesos pequenos, geralmente aleatórios.",
  "Forward pass": "Propagação direta",
  "Process sensor measurements to predict failure probability.":
    "Processe as medições dos sensores para prever a probabilidade de falha.",
  "Measure error": "Medir o erro",
  "Compare the prediction with the actual label using a loss function.":
    "Compare a previsão com o rótulo real usando uma função de perda.",
  "Compute how the weights contributed to the prediction error.":
    "Calcule como os pesos contribuíram para o erro da previsão.",
  "Update weights": "Atualizar os pesos",
  "Adjust them using gradient descent to reduce the loss.":
    "Ajuste os pesos com descida do gradiente para reduzir a perda.",
  "Train on examples over multiple epochs and evaluate on unseen data.":
    "Treine com exemplos ao longo de várias épocas e avalie com dados inéditos.",
  "Written by humans": "Escrita por pessoas",
  "Learned from data": "Aprendida com os dados",
  "Expert-defined rules": "Regras definidas por especialistas",
  "Labeled observations": "Observações rotuladas",
  "Modify the code": "Modificar o código",
  "Retrain or update the model": "Retreinar ou atualizar o modelo",
  "Complex patterns": "Padrões complexos",
  "Requires increasingly complex rules": "Exige regras cada vez mais complexas",
  "Can learn nonlinear patterns": "Pode aprender padrões não lineares",
  "Individual rules are explicit": "As regras individuais são explícitas",
  "Learned behavior may be harder to interpret":
    "O comportamento aprendido pode ser mais difícil de interpretar",
  "Main limitation": "Principal limitação",
  "Rule complexity and maintenance": "Complexidade e manutenção das regras",
  "Data quality, generalization and evaluation": "Qualidade dos dados, generalização e avaliação",
  "Training data is too small or unrepresentative.":
    "Os dados de treino são insuficientes ou pouco representativos.",
  "Labels contain errors.": "Os rótulos contêm erros.",
  "It learns noise instead of generalizable patterns (overfitting).":
    "Ela aprende o ruído em vez de padrões generalizáveis (sobreajuste).",
  "The machine's operating conditions change (distribution shift).":
    "As condições de operação da máquina mudam (mudança de distribuição).",
  "Machines that learn": "Máquinas que aprendem",
  "from examples": "com exemplos",
  "Classical programming asks you to write the rules. Machine learning asks you to collect the examples — and lets the rules be discovered. Here's the whole story, in one place.":
    "Na programação clássica, você escreve as regras. No aprendizado de máquina, você reúne os exemplos e deixa que as regras sejam descobertas. Aqui está a história completa, em um só lugar.",
  "The problem": "O problema",
  "A factory floor full of machines, each reporting temperature and vibration. Some are operating normally; some are at risk of failure. Plotted, the two groups interlock like two crescents — no single straight line separates them.":
    "Uma fábrica cheia de máquinas, cada uma informando temperatura e vibração. Algumas operam normalmente; outras correm risco de falha. No gráfico, os dois grupos se encaixam como duas meias-luas: nenhuma reta os separa.",
  Programming: "Programação",
  "We asked a domain expert for the rules and translated their assumptions into code.":
    "Pedimos as regras a um especialista da área e traduzimos suas hipóteses em código.",
  "It gets": "Ele acerta",
  "machines right —": "máquinas, com",
  "% accuracy. Thresholds on one feature at a time can only draw rectangles, but the at-risk machines form a curved arch. We could add more rules, but what about the next exception?":
    "% de acurácia. Limiares sobre uma variável de cada vez só conseguem desenhar retângulos, mas as máquinas em risco formam um arco. Podemos adicionar regras, mas e a próxima exceção?",
  "Machine learning": "Aprendizado de máquina",
  "Instead of writing the classification logic ourselves, we gave a small neural network examples of machines with known outcomes, and let it learn the pattern.":
    "Em vez de escrever a lógica de classificação, demos a uma pequena rede neural exemplos de máquinas com resultados conhecidos e deixamos que ela aprendesse o padrão.",
  "How does the network learn?": "Como a rede aprende?",
  "With a hidden layer, backpropagation bends the decision boundary around the arch and separates all":
    "Com uma camada oculta, a retropropagação curva a fronteira de decisão ao redor do arco e separa todas as",
  "machines — combinations of temperature and vibration that are difficult to describe with a few straightforward rules.":
    "máquinas: combinações de temperatura e vibração difíceis de descrever com poucas regras simples.",
  "Compare the two approaches": "Compare as duas abordagens",
  Dimension: "Dimensão",
  "Traditional programming": "Programação tradicional",
  "See it break": "Veja onde falha",
  "See it break — machine learning is not magic":
    "Veja onde falha: aprendizado de máquina não é mágica",
  "A neural network can fail when:": "Uma rede neural pode falhar quando:",
  "A model that performs perfectly on its training examples may still make mistakes on new machines.":
    "Um modelo perfeito nos exemplos de treino ainda pode errar em máquinas novas.",
  "Key takeaway: machine learning is useful when patterns are difficult to specify manually but can be learned from sufficiently representative data. It does not automatically outperform rules.":
    "Ideia principal: o aprendizado de máquina é útil quando os padrões são difíceis de especificar manualmente, mas podem ser aprendidos com dados representativos. Ele não supera regras automaticamente.",
  "✓ Separated — {0}/{1} correct; the hand-written rules got {2}/{3}. The hidden neurons bent the boundary around the at-risk arch.":
    "✓ Separadas: {0}/{1} corretas; as regras manuais acertaram {2}/{3}. Os neurônios ocultos curvaram a fronteira ao redor do arco de risco.",
  "Press Train. Each small square is what one neuron “sees” across temperature × vibration; the big chart is the final decision.":
    "Clique em Treinar. Cada quadrado mostra o que um neurônio vê no plano temperatura × vibração; o gráfico maior mostra a decisão final.",
  "No hidden layer = a single neuron: its boundary is a straight line, and no straight line separates these two arches. Add a hidden layer.":
    "Sem camada oculta, há apenas um neurônio: sua fronteira é uma reta, e nenhuma reta separa estes dois arcos. Adicione uma camada oculta.",
  "Linear activation: stacked linear layers collapse into one straight line, so depth adds nothing. The non-linear activation is what lets hidden layers bend the boundary.":
    "Ativação linear: camadas lineares empilhadas equivalem a uma única reta, então a profundidade não acrescenta nada. A ativação não linear permite curvar a fronteira.",
  "Still not separated after {0} epochs. Try more neurons, a different activation, or another learning rate.":
    "Ainda não houve separação após {0} épocas. Tente mais neurônios, outra ativação ou outra taxa de aprendizado.",
  "Training… watch the loss fall and the boundary bend.":
    "Treinando… observe a perda diminuir e a fronteira se curvar.",
  "Learn the rules": "Aprenda as regras",
  "from data": "com os dados",
  "Instead of writing the classification logic ourselves, we give a neural network the same":
    "Em vez de escrever a lógica de classificação, damos a uma rede neural as mesmas",
  "machines the rules were tested on, with their known outcomes. Backpropagation (1986) pushes the error backwards through the hidden layers and nudges every weight — and the hidden neurons learn to bend the boundary where a fixed threshold can't.":
    "máquinas usadas para testar as regras, com seus resultados conhecidos. A retropropagação (1986) leva o erro para trás pelas camadas ocultas e ajusta cada peso. Os neurônios aprendem a curvar a fronteira onde um limiar fixo não consegue.",
  "Network configuration": "Configuração da rede",
  "Hidden layers": "Camadas ocultas",
  layer: "camada",
  "Fewer neurons in layer {0}": "Menos neurônios na camada {0}",
  "More neurons in layer {0}": "Mais neurônios na camada {0}",
  Activation: "Ativação",
  "Learning rate": "Taxa de aprendizado",
  "The network": "A rede",
  "Input → hidden → output: each node shows what it has learned to see":
    "Entrada → camadas ocultas → saída: cada nó mostra o que aprendeu a perceber",
  "Hide weights & math": "Ocultar pesos e cálculos",
  "Show weights & math": "Mostrar pesos e cálculos",
  "At Risk?": "Em risco?",
  'a machine at {0} °C, {1} mm/s (from "Classify a new example")':
    'uma máquina a {0} °C, {1} mm/s (de "Classificar um novo exemplo")',
  "Train the network": "Treinar a rede",
  Step: "Passo",
  Reset: "Reiniciar",
  "Network accuracy": "Acurácia da rede",
  "Rules accuracy": "Acurácia das regras",
  "Temperature (°C)": "Temperatura (°C)",
  "Vibration (mm/s)": "Vibração (mm/s)",
  "neural network": "rede neural",
  "your rules": "suas regras",
  "Accuracy (%)": "Acurácia (%)",
  Accuracy: "Acurácia",
  "— the share of the": "— a proporção das",
  "machines whose predicted class (probability above or below 50%) matches the real label.":
    "máquinas cuja classe prevista (probabilidade acima ou abaixo de 50%) corresponde ao rótulo real.",
  "After {0} epochs the network is at {1}% ({2}/{3}); the dashed line is the rules' fixed {4}%. {5}":
    "Após {0} épocas, a rede está em {1}% ({2}/{3}); a linha tracejada mostra os {4}% fixos das regras. {5}",
  "The network beats them because it learned the curved boundary from the data.":
    "A rede supera as regras porque aprendeu a fronteira curva com os dados.",
  "Keep training — or change the architecture — to beat them.":
    "Continue treinando ou altere a arquitetura para superar as regras.",
  "loss (cross-entropy)": "perda (entropia cruzada)",
  Loss: "Perda",
  "— cross-entropy: how far the predicted probabilities are from the true labels. 0 is confidently right; about 0.69 is a coin-flip guess. It's what backpropagation minimizes.":
    "— entropia cruzada: a distância entre as probabilidades previstas e os rótulos reais. 0 indica um acerto confiante; cerca de 0,69 equivale a um palpite aleatório. É o que a retropropagação minimiza.",
  "It fell from {0} to {1}: {2}": "Caiu de {0} para {1}: {2}",
  "the network is not just right but confident on almost every machine.":
    "a rede acerta com confiança quase todas as máquinas.",
  "it's still unsure about some machines near the boundary.":
    "a rede ainda tem dúvidas sobre algumas máquinas próximas da fronteira.",
  "Classify a new example": "Classificar um novo exemplo",
  Classify: "Classificar",
  "Network:": "Rede:",
  "% at risk —": "% de risco —",
  "B — At Risk": "B — Em risco",
  "A — Normal": "A — Normal",
  "Rules:": "Regras:",
  "Unlike a manually defined if/else program, the network learns the combination of temperature and vibration from the data itself — and the curved line above shows exactly what it decided.":
    "Diferentemente de um programa if/else definido manualmente, a rede aprende a combinação de temperatura e vibração com os próprios dados. A curva acima mostra exatamente o que ela decidiu.",
  "HIDDEN {0} ({1})": "OCULTA {0} ({1})",
  "Live diagram of the {0} network: each node is a small thumbnail of what it computes across the input plane":
    "Diagrama da rede {0}: cada nó mostra uma miniatura do que calcula no plano de entrada",
  "Every neuron computes": "Cada neurônio calcula",
  "A weighted sum of the previous layer's outputs plus a bias, squashed by an activation f (":
    "Uma soma ponderada das saídas da camada anterior mais um viés, transformada por uma ativação f (",
  'in hidden layers, σ = sigmoid at the output, so ŷ is a 0–1 probability of "at risk"). This network has':
    "nas camadas ocultas, σ = sigmoide na saída, então ŷ é a probabilidade de risco entre 0 e 1). Esta rede tem",
  "weights and biases to learn.": "pesos e vieses para aprender.",
  "Layer by layer": "Camada por camada",
  "Worked example —": "Exemplo calculado —",
  "(scaled inputs)": "(entradas normalizadas)",
  "hidden {0}, neuron 1": "oculta {0}, neurônio 1",
  "% at risk →": "% de risco →",
  "How training changes the weights": "Como o treino altera os pesos",
  "The loss L is small when ŷ is confidently right (y is the true label: 1 at risk, 0 normal). Backpropagation applies the chain rule from the output back to every weight to get ∂L/∂w — how much the loss would change if that weight moved — and each step nudges every weight a little in the direction that lowers the loss.":
    "A perda L é pequena quando ŷ acerta com confiança (y é o rótulo real: 1 em risco, 0 normal). A retropropagação aplica a regra da cadeia da saída até cada peso para obter ∂L/∂w: quanto a perda mudaria se esse peso variasse. Cada passo ajusta os pesos na direção que reduz a perda.",
  "How hot is the machine?": "Qual é a temperatura da máquina?",
  "How much is it vibrating?": "Quanto ela está vibrando?",
  "Can we predict": "Podemos prever",
  "machine failure?": "falhas nas máquinas?",
  "Imagine a factory with hundreds of machines. Each machine has sensors that continuously measure its operating conditions. Our goal is to predict whether a machine is operating normally or is at risk of failure.":
    "Imagine uma fábrica com centenas de máquinas. Cada uma possui sensores que medem continuamente suas condições de operação. Nosso objetivo é prever se uma máquina opera normalmente ou corre risco de falha.",
  "Input features": "Variáveis de entrada",
  "Each observation contains two input features and a classification:":
    "Cada observação contém duas variáveis de entrada e uma classificação:",
  "(machine is operating safely) or": "(a máquina opera com segurança) ou",
  "(machine may require maintenance).": "(a máquina pode precisar de manutenção).",
  "Example dataset": "Conjunto de dados de exemplo",
  "Example dataset —": "Conjunto de dados de exemplo —",
  machines: "máquinas",
  Temperature: "Temperatura",
  Vibration: "Vibração",
  Classification: "Classificação",
  "Illustrative synthetic training data, with labels assigned for the lesson — not actual industrial safety thresholds.":
    "Dados sintéticos ilustrativos, com rótulos atribuídos para a aula. Não representam limiares reais de segurança industrial.",
  "Visualize the problem": "Visualize o problema",
  "Think about it": "Reflita",
  "Can you draw a single line separating normal machines from machines at risk? What happens when new data arrives?":
    "Você consegue traçar uma única reta que separe as máquinas normais das máquinas em risco? O que acontece quando chegam novos dados?",
  "Define the rules": "Defina as regras",
  "by hand": "manualmente",
  "Traditionally, we ask a domain expert to define the logic: high temperature is dangerous, high vibration is dangerous, and moderate temperature and vibration together may also indicate a problem. We translate these assumptions into code.":
    "Tradicionalmente, pedimos a um especialista que defina a lógica: temperatura alta é perigosa, vibração alta é perigosa, e níveis moderados de ambas também podem indicar um problema. Traduzimos essas hipóteses em código.",
  "The algorithm": "O algoritmo",
  Code: "Código",
  Flowchart: "Fluxograma",
  "This is traditional programming: humans provide the rules, and the computer executes them.":
    "Isto é programação tradicional: as pessoas fornecem as regras e o computador as executa.",
  "Run the algorithm": "Executar o algoritmo",
  "Run again": "Executar novamente",
  Actual: "Real",
  Predicted: "Previsto",
  "The shading is what the rules decide everywhere on the chart, and the line is where their decision flips. Every edge is straight and parallel to an axis — each":
    "O preenchimento mostra a decisão das regras em cada ponto do gráfico; a linha indica onde a decisão muda. Toda borda é reta e paralela a um eixo: cada",
  'tests one sensor against one threshold, so the "at risk" region is a union of rectangles.':
    "testa um sensor contra um limiar, então a região de risco é uma união de retângulos.",
  "Dashed rings mark the machines the rules got wrong.":
    "Os círculos tracejados marcam as máquinas classificadas incorretamente pelas regras.",
  "Press Play to run the rules and see the regions they carve out of the chart.":
    "Clique em Executar para aplicar as regras e ver as regiões que elas delimitam no gráfico.",
  "rules accuracy": "acurácia das regras",
  "Machines evaluated": "Máquinas avaliadas",
  "is the share of machines whose predicted class matches the real label.":
    "é a proporção de máquinas cuja classe prevista corresponde ao rótulo real.",
  "After all {0} machines the rules finish at {1}% ({2}/{3}). Each dip is a machine on the wrong side of a threshold: the hot-but-normal machines (86–94 °C) and the cool-but-at-risk ones (50–52 °C). Unlike a trained model, nothing improves this number except rewriting the rules by hand.":
    "Após todas as {0} máquinas, as regras terminam com {1}% ({2}/{3}). Cada queda corresponde a uma máquina do lado errado de um limiar: as quentes e normais (86–94 °C) e as frias em risco (50–52 °C). Esse número só melhora reescrevendo as regras manualmente.",
  "Watch it move as each machine is checked.":
    "Observe a mudança conforme cada máquina é avaliada.",
  "Where do these rules break down?": "Onde essas regras falham?",
  "These rules get": "Essas regras acertam",
  "% accuracy. Each rule is a threshold on one feature, so together they can only carve the chart into rectangles. But the at-risk machines form an arch: risk depends on how temperature and vibration combine. Some hot machines with low vibration are fine; some cool machines with moderate vibration are not. We could add more rules, but what about the next exception?":
    "% de acurácia. Cada regra aplica um limiar a uma variável, então juntas só delimitam retângulos. Mas as máquinas em risco formam um arco: o risco depende da combinação de temperatura e vibração. Algumas máquinas quentes com baixa vibração estão bem; algumas frias com vibração moderada não. Podemos adicionar regras, mas e a próxima exceção?",
  "As sensors, operating conditions, and interactions increase, manually defining and maintaining all the rules becomes expensive and error-prone. The problem is no longer writing code. It is discovering the right rules.":
    "Com mais sensores, condições de operação e interações, definir e manter todas as regras manualmente fica caro e sujeito a erros. O desafio deixa de ser escrever código e passa a ser descobrir as regras certas.",
  "temperature > 85 ?": "temperatura > 85 ?",
  "vibration > 6 ?": "vibração > 6 ?",
  "temperature > 75": "temperatura > 75",
  "and vibration > 4 ?": "e vibração > 4 ?",
  "Flowchart: three yes/no checks in order; any yes ends at {0}, three no's end at {1}.":
    "Fluxograma: três verificações sim/não em sequência; qualquer sim termina em {0}, três respostas não terminam em {1}.",
  "Start: read sensors": "Início: ler sensores",
  yes: "sim",
  "Task:": "Tarefa:",
  "Data:": "Dados:",
  "What do these measure?": "O que estas métricas medem?",
  "Confusion matrix: {0} true positives, {1} false negatives, {2} false positives, {3} true negatives.":
    "Matriz de confusão: {0} verdadeiros positivos, {1} falsos negativos, {2} falsos positivos, {3} verdadeiros negativos.",
  predicted: "previsto",
  actual: "real",
  "Classification Metrics": "Métricas de classificação",
  "Information gain at the root: {0}.": "Ganho de informação na raiz: {0}.",
  "information gain at the root — highest wins": "ganho de informação na raiz: vence o maior",
  "Decision tree": "Árvore de decisão",
  "Classification — should we play tennis today? Yes or No.":
    "Classificação: devemos jogar tênis hoje? Sim ou não.",
  "Mitchell's own example (1997, Table 3.2): {0} days, each with outlook, temperature, humidity and wind.":
    "Exemplo de Mitchell (1997, Tabela 3.2): {0} dias, cada um com condição do tempo, temperatura, umidade e vento.",
  "Decision tree learned from Play Tennis: split on outlook, then humidity for sunny days and wind for rainy days.":
    "Árvore aprendida com Play Tennis: divide pela condição do tempo, depois pela umidade nos dias ensolarados e pelo vento nos chuvosos.",
  "A tree of questions. Each node tests one attribute, each branch is one answer, each leaf is a decision. To classify a day, start at the top and follow its answers down.":
    "Uma árvore de perguntas. Cada nó testa um atributo, cada ramo é uma resposta e cada folha é uma decisão. Para classificar um dia, comece no topo e siga suas respostas.",
  "ID3 grows the tree greedily: at each node it asks the question that removes the most uncertainty (entropy) about the answer, then repeats on every branch until each leaf is pure. Outlook wins the root; Humidity and Wind win below it.":
    "O ID3 constrói a árvore de forma gulosa: em cada nó escolhe a pergunta que mais reduz a incerteza (entropia) e repete em cada ramo até as folhas serem puras. Condição do tempo vence na raiz; umidade e vento vêm depois.",
  "Scored on unseen days: rebuild the tree without each day, then ask about that day (leave-one-out). On its own training days it gets":
    "Avaliação em dias inéditos: reconstrua a árvore sem cada dia e depois faça a previsão desse dia (leave-one-out). Nos próprios dias de treino, ela obtém",
  ", since a pure tree memorizes them. With only yes/no answers, AUC is the average of recall and specificity.":
    ", pois uma árvore pura os memoriza. Com respostas apenas sim/não, AUC é a média entre sensibilidade e especificidade.",
  "Linear regression": "Regressão linear",
  "Regression — what will this house sell for? A number, not a category.":
    "Regressão: por quanto esta casa será vendida? Um número, não uma categoria.",
  "{0} illustrative house sales: floor area (m²) → sale price (thousands).":
    "{0} vendas ilustrativas: área (m²) → preço de venda (milhares).",
  "price =": "preço =",
  "·area": "·área",
  "House sale": "Venda de imóvel",
  "Floor area (m²)": "Área (m²)",
  "Price (k)": "Preço (k)",
  "A function and its graph: a straight line with two parameters, the price per m² (w) and a base price (b). A 100 m² house →":
    "Uma função e seu gráfico: uma reta com dois parâmetros, o preço por m² (w) e um preço base (b). Uma casa de 100 m² →",
  "k. It can only ever describe a steady trend.":
    "k. Ela só consegue descrever uma tendência constante.",
  "error (RMSE)": "erro (RMSE)",
  "Gradient descent on the mean squared error: start with a flat line, then nudge w and b downhill each epoch. (Least squares can also solve this one directly, in closed form.)":
    "Descida do gradiente sobre o erro quadrático médio: comece com uma reta horizontal e ajuste w e b em cada época na direção de menor erro. Mínimos quadrados também resolve este caso diretamente, em forma fechada.",
  "Regression Metrics": "Métricas de regressão",
  "There's no \"right or wrong\" for a price, so regression measures how far off it is. MAE and RMSE are in the target's own units (RMSE punishes big misses more), MAPE is the typical miss in percent, and R² is the share of the price variation the line explains.":
    "Para um preço, não há apenas certo ou errado: a regressão mede o tamanho do erro. MAE e RMSE usam as unidades do alvo (RMSE penaliza mais os erros grandes), MAPE expressa o erro em porcentagem e R² indica quanto da variação do preço a reta explica.",
  "Logistic regression": "Regressão logística",
  "Classification — will this student pass the exam? A probability, then a yes/no.":
    "Classificação: este aluno vai passar na prova? Uma probabilidade e depois sim ou não.",
  '{0} students: hours studied → passed or failed (the worked example from Wikipedia\'s "Logistic regression" article).':
    '{0} alunos: horas de estudo → aprovação ou reprovação (exemplo do artigo "Logistic regression" da Wikipedia).',
  "·hours": "·horas",
  "Hours studied": "Horas de estudo",
  'The same weighted sum as linear regression, squashed by the sigmoid σ into a probability between 0% and 100%. Answer "pass" when p ≥ 50%, i.e. after':
    "A mesma soma ponderada da regressão linear, transformada pela sigmoide σ em uma probabilidade entre 0% e 100%. Preveja aprovação quando p ≥ 50%, ou seja, após",
  "hours: one cut-off, a straight-line boundary.":
    "horas: um único ponto de corte, uma fronteira reta.",
  "log loss": "perda logarítmica",
  "Log loss": "Perda logarítmica",
  "Gradient descent on log loss (cross-entropy), which punishes a confident wrong probability hardest. Unlike linear regression's MSE, there is no closed-form answer, so it must be searched for.":
    "Descida do gradiente sobre a perda logarítmica (entropia cruzada), que penaliza fortemente previsões erradas e confiantes. Diferentemente do MSE da regressão linear, não há solução em forma fechada: é preciso buscá-la.",
  "Accuracy alone hides which mistakes are made. Precision asks how many predicted passes really passed, recall how many real passes were caught, and F1 balances the two. AUC scores the probabilities themselves, before any 50% cut-off.":
    "A acurácia sozinha esconde quais erros ocorrem. Precisão mede quantas aprovações previstas realmente aconteceram; sensibilidade mede quantas aprovações reais foram detectadas; F1 equilibra as duas. AUC avalia as probabilidades antes do corte de 50%.",
  "Clustering (k-means)": "Agrupamento (k-means)",
  "Clustering — which flowers belong together? No labels to predict.":
    "Agrupamento: quais flores pertencem ao mesmo grupo? Sem rótulos para prever.",
  "{0} flowers from Fisher's Iris data (1936): petal length and width. The species is hidden from the algorithm.":
    "{0} flores do conjunto Iris de Fisher (1936): comprimento e largura das pétalas. A espécie é ocultada do algoritmo.",
  "Petal length (cm)": "Comprimento da pétala (cm)",
  "Petal width (cm)": "Largura da pétala (cm)",
  "k centre points (×), here k =": "k centroides (×), aqui k =",
  ". Each flower belongs to whichever centre is nearest, so the whole model is just":
    ". Cada flor pertence ao centroide mais próximo, então o modelo inteiro consiste em",
  "coordinates.": "coordenadas.",
  "k-means alternates two steps: assign every flower to its nearest centre, then move each centre to the mean of its flowers. It repeats until nothing moves, a few rounds here.":
    "O k-means alterna duas etapas: atribuir cada flor ao centroide mais próximo e mover cada centroide para a média das suas flores. Repete até nada se mover, em poucas rodadas aqui.",
  "elbow: inertia per k": "cotovelo: inércia por k",
  "Number of clusters k": "Número de grupos k",
  "Match species": "Correspondência com espécies",
  "Clustering Metrics": "Métricas de agrupamento",
  "With no labels, the measures are internal. The elbow shows inertia stops dropping sharply after k =":
    "Sem rótulos, as métricas são internas. O cotovelo mostra que a inércia para de cair rapidamente após k =",
  "; silhouette and Davies–Bouldin score how tight and separated the groups are. Iris happens to have known species, so we can also check afterwards. Real clustering problems usually can't.":
    "; silhueta e Davies–Bouldin avaliam a coesão e a separação dos grupos. Iris tem espécies conhecidas, permitindo uma verificação posterior. Problemas reais de agrupamento geralmente não permitem isso.",
  "Neural network (again, summarized)": "Rede neural (resumo)",
  "Classification — is this machine Normal or At Risk?":
    "Classificação: esta máquina está normal ou em risco?",
  "This chapter's own {0} machines: temperature and vibration.":
    "As {0} máquinas deste capítulo: temperatura e vibração.",
  "Layers of weighted connections,": "Camadas de conexões ponderadas,",
  ": logistic regressions stacked, enough to bend the boundary around the arch, which a single line can't.":
    ": regressões logísticas empilhadas, suficientes para curvar a fronteira ao redor do arco, o que uma única reta não consegue.",
  "Backpropagation and gradient descent: the same log loss as logistic regression, pushed back through every layer to update all 25 weights and biases.":
    "Retropropagação e descida do gradiente: a mesma perda logarítmica da regressão logística, propagada para trás pelas camadas para atualizar os 25 pesos e vieses.",
  "at risk": "em risco",
  "The same classification metrics, on the": "As mesmas métricas de classificação, nas",
  "machines it trained on. Perfect scores here only show it fits this data; new machines are the real test.":
    "máquinas usadas no treino. Resultados perfeitos aqui só mostram o ajuste a estes dados; máquinas novas são o verdadeiro teste.",
  "{0} training points": "{0} pontos de treino",
  "degree {0}": "grau {0}",
  "Bias &": "Viés e",
  "A model can fail in two opposite ways. Too simple, and it misses the pattern even in the data it trained on —":
    "Um modelo pode falhar de duas formas opostas. Simples demais, perde o padrão até nos dados de treino —",
  bias: "viés",
  ". Too flexible, and it memorizes that data's noise, then stumbles on anything new —":
    ". Flexível demais, memoriza o ruído desses dados e falha em dados novos —",
  variance: "variância",
  ". Every metric in this chapter is only meaningful once you know which of the two you're fighting.":
    ". As métricas deste capítulo só fazem sentido quando você sabe qual desses problemas está enfrentando.",
  "Bias and variance as a target": "Viés e variância como um alvo",
  "The classic picture: the bullseye is the true answer, and each dot is the prediction of one model trained on a different sample of data.":
    "A imagem clássica: o centro do alvo é a resposta verdadeira; cada ponto é a previsão de um modelo treinado com uma amostra diferente.",
  Bias: "Viés",
  "— how far the": "— a distância entre a previsão",
  average: "média",
  "prediction lands from the truth. A systematic error: the model aims at the wrong spot, usually because it is too simple to capture the pattern.":
    "e a verdade. Um erro sistemático: o modelo mira no lugar errado, geralmente por ser simples demais para capturar o padrão.",
  Variance: "Variância",
  "— how much the predictions scatter when the training data changes. An inconsistency error: the model is so flexible it chases the noise in whatever sample it saw.":
    "— quanto as previsões se espalham quando os dados de treino mudam. Uma inconsistência: o modelo é tão flexível que segue o ruído de cada amostra.",
  "The goal is the top-left target: low bias": "O objetivo é o alvo superior esquerdo: baixo viés",
  and: "e",
  "low variance. In practice, making a model more flexible moves it right-to-left (less bias) but top-to-bottom (more variance) — the trade-off the rest of this lesson measures.":
    "baixa variância. Na prática, aumentar a flexibilidade move o modelo da direita para a esquerda (menos viés), mas de cima para baixo (mais variância). É a troca que esta aula mede.",
  "The running example is the classic curve-fitting demo (Bishop, 2006):":
    "O exemplo é a demonstração clássica de ajuste de curvas (Bishop, 2006):",
  "noisy points drawn from a hidden sine wave, fitted with polynomials of growing degree. The degree is the Representation choice — how wiggly the curve may be.":
    "pontos ruidosos de uma senoide oculta, ajustados por polinômios de grau crescente. O grau define a Representação: quanto a curva pode oscilar.",
  "training error": "erro de treino",
  "test error": "erro de teste",
  "Errors are mean squared error: training on the": "Os erros são quadráticos médios: treino nos",
  "points shown, test on": "pontos exibidos e teste em",
  "fresh points from the same sine wave. The noise alone puts a floor under any model's test error: σ² =":
    "pontos novos da mesma senoide. O próprio ruído impõe um piso ao erro de teste: σ² =",
  "Underfitting: both errors are high — the curve can't bend enough to follow the wave.":
    "Subajuste: ambos os erros são altos; a curva não consegue acompanhar a onda.",
  "Overfitting: training error is near zero, yet test error climbs — the curve threads every noisy point.":
    "Sobreajuste: o erro de treino quase zera, mas o de teste aumenta; a curva passa por cada ponto ruidoso.",
  "About right: both errors are low and close together.":
    "Bom ajuste: ambos os erros são baixos e próximos.",
  "Underfitting: high bias": "Subajuste: alto viés",
  "Bias is the error from wrong assumptions: how far the":
    "Viés é o erro causado por hipóteses incorretas: a distância entre o modelo",
  "fitted model, over many possible training sets, sits from the truth. A straight line through a sine wave is wrong no matter how much data you give it.":
    "ajustado, em muitos conjuntos de treino possíveis, e a verdade. Uma reta sobre uma senoide está errada, independentemente da quantidade de dados.",
  "Symptom: training error is high, and test error is about as high. More data won't help; a richer representation (more features, higher degree, less regularization) will.":
    "Sintoma: erro de treino alto e erro de teste semelhante. Mais dados não ajudam; uma representação mais rica (mais variáveis, grau maior, menos regularização) ajuda.",
  "Overfitting: high variance": "Sobreajuste: alta variância",
  "Variance is how much the fitted model changes when the training set changes. A degree-9 polynomial has 10 coefficients for 10 points, so it can pass through every one — noise included — and a different sample gives a wildly different curve.":
    "Variância mede quanto o modelo muda quando o conjunto de treino muda. Um polinômio de grau 9 tem 10 coeficientes para 10 pontos, podendo passar por todos, inclusive o ruído. Outra amostra produz uma curva muito diferente.",
  "Symptom: training error near zero, test error much higher. The gap between them is the tell. Fix it with more data, a simpler representation, regularization, or by averaging many models (ensembles).":
    "Sintoma: erro de treino quase zero, erro de teste muito maior. A diferença é o sinal. Use mais dados, um modelo mais simples, regularização ou médias de vários modelos (ensembles).",
  "The trade-off: training vs. test error": "A troca: erro de treino e de teste",
  "Error on the training data and on unseen data, for every degree. Training error only ever falls as the model gets more flexible; test error falls, bottoms out, then rises.":
    "Erro nos dados de treino e em dados inéditos para cada grau. O erro de treino sempre diminui com a flexibilidade; o de teste cai, atinge um mínimo e depois sobe.",
  "This U-shape is why you never judge a model on its training data. The best test error here is at degree":
    "Essa forma de U explica por que não se avalia um modelo nos dados de treino. O melhor erro de teste aqui ocorre no grau",
  "); beyond it, every extra degree of freedom fits noise.":
    "); além dele, cada grau de liberdade adicional ajusta ruído.",
  "Polynomial degree (model complexity)": "Grau do polinômio (complexidade do modelo)",
  "Mean squared error": "Erro quadrático médio",
  "The decomposition": "A decomposição",
  "Refit each degree on 200 fresh training sets and measure, across x, how far the average curve is from the truth (bias²) and how much the curves disagree with each other (variance). Expected test error is their sum plus the noise.":
    "Reajuste cada grau em 200 conjuntos de treino novos e meça, ao longo de x, a distância entre a curva média e a verdade (viés²) e a discordância entre curvas (variância). O erro de teste esperado é a soma dos dois com o ruído.",
  "It names the two forces behind the U-shape: bias² falls with complexity, variance rises. You can trade one for the other, but the noise σ² is irreducible — no model gets below it.":
    "São as duas forças por trás da forma de U: viés² diminui com a complexidade e variância aumenta. Você pode trocar um pelo outro, mas o ruído σ² é irredutível.",
  "bias²": "viés²",
  "bias² + variance + σ²": "viés² + variância + σ²",
  "σ² (noise floor)": "σ² (piso de ruído)",
  "Polynomial degree": "Grau do polinômio",
  "Measuring it: validation and cross-validation": "Como medir: validação e validação cruzada",
  "In practice there is no extra test set to peek at. Split the data instead: train on part, validate on the rest, and keep a final test set untouched until the end. k-fold cross-validation rotates the validation part through all k folds and averages.":
    "Na prática, não há um conjunto de teste extra para consultar. Divida os dados: treine em uma parte, valide no restante e reserve um teste final intocado. A validação cruzada em k partes alterna a parte de validação e calcula a média.",
  "It estimates test error using only the training data, so you can pick the degree honestly.":
    "Ela estima o erro de teste usando apenas os dados de treino, permitindo escolher o grau de forma honesta.",
  "-fold CV on the": "partes de validação cruzada nos",
  "points picks degree": "pontos escolhem o grau",
  ". With only": ". Com apenas",
  "points per fit, degrees above": "pontos por ajuste, graus acima de",
  "can't be fitted reliably and are left off — small data limits how complex a model you can even assess.":
    "não podem ser ajustados com confiança e são omitidos: poucos dados limitam a complexidade que se consegue avaliar.",
  "{0}-fold cross-validation: each round validates on a different fold.":
    "Validação cruzada em {0} partes: cada rodada valida em uma parte diferente.",
  round: "rodada",
  train: "treinar",
  validate: "validar",
  "{0}-fold CV error": "erro de validação cruzada em {0} partes",
  "true test error": "erro de teste real",
  "Learning curves": "Curvas de aprendizado",
  "Training and test error as the training set grows, for a fixed model. Here: a straight line (degree 1) and the flexible degree-9 polynomial.":
    "Erro de treino e teste conforme o conjunto de treino cresce, para um modelo fixo. Aqui: uma reta (grau 1) e um polinômio flexível de grau 9.",
  "They tell you whether more data is worth collecting. The degree-9 gap closes as data grows — variance shrinks. The straight line's two errors meet at a high plateau straight away — bias doesn't shrink, so more data is wasted on it.":
    "Elas indicam se vale coletar mais dados. A diferença do grau 9 diminui com mais dados: a variância cai. Os dois erros da reta logo se encontram em um patamar alto: o viés não diminui.",
  "degree 1, test": "grau 1, teste",
  "degree 1, train": "grau 1, treino",
  "degree 9, test": "grau 9, teste",
  "degree 9, train": "grau 9, treino",
  "Training set size": "Tamanho do conjunto de treino",
  "Diagnosis at a glance": "Diagnóstico rápido",
  Symptom: "Sintoma",
  Diagnosis: "Diagnóstico",
  Try: "Experimente",
  "High training error, test error about the same": "Erro de treino alto; erro de teste parecido",
  "High bias (underfitting)": "Alto viés (subajuste)",
  "Richer model, better features, less regularization, train longer":
    "Modelo mais rico, melhores variáveis, menos regularização, mais treino",
  "Low training error, much higher test error": "Erro de treino baixo; erro de teste muito maior",
  "High variance (overfitting)": "Alta variância (sobreajuste)",
  "More data, simpler model, regularization, early stopping, ensembles":
    "Mais dados, modelo mais simples, regularização, parada antecipada, ensembles",
  "Both low and close together": "Ambos baixos e próximos",
  "A good fit": "Um bom ajuste",
  "Confirm once on the untouched test set": "Confirme uma vez no conjunto de teste reservado",
  "Accurate and consistent — the goal": "Correto e consistente: o objetivo",
  "Consistent, but consistently off": "Consistente, mas sempre deslocado",
  "Right on average, but scattered": "Correto em média, mas disperso",
  "Off and scattered — the worst case": "Deslocado e disperso: o pior caso",
  "{0} bias, {1} variance: shots {2} the bullseye, {3}.":
    "Viés {0}, variância {1}: pontos {2} o centro do alvo, {3}.",
  "centred away from": "deslocados em relação a",
  "centred on": "centrados em",
  "widely scattered": "muito dispersos",
  "tightly grouped": "bem agrupados",
  "Low bias": "Baixo viés",
  "High bias": "Alto viés",
  'A classifier answers "which category?" — and every answer is either right or wrong. But not all wrong answers cost the same: missing a fraud is not the same mistake as flagging an honest customer. Each metric below counts the mistakes a different way.':
    "Um classificador responde qual categoria, e cada resposta está certa ou errada. Mas os erros não custam o mesmo: deixar passar uma fraude difere de acusar um cliente honesto. Cada métrica conta os erros de uma forma.",
  "The running example is the exam model from ML Components: logistic regression turns hours studied into a probability of passing, for":
    "O exemplo é o modelo de provas de Componentes de ML: a regressão logística transforma horas de estudo em probabilidade de aprovação para",
  "students. A probability only becomes a yes/no once you pick a":
    "alunos. Uma probabilidade só vira sim/não depois de escolher um",
  threshold: "limiar",
  "— drag it and watch sections 1–4 change.": "— arraste e observe as seções 1–4 mudarem.",
  "Confusion matrix": "Matriz de confusão",
  "Every prediction lands in one of four boxes: a true positive (TP, a pass predicted as pass), a false negative (FN, a pass missed), a false positive (FP, a fail predicted as pass) or a true negative (TN).":
    "Toda previsão cai em uma de quatro categorias: verdadeiro positivo (TP, aprovação prevista corretamente), falso negativo (FN, aprovação não detectada), falso positivo (FP, reprovação prevista como aprovação) ou verdadeiro negativo (TN).",
  "Every other classification metric is a ratio of these four counts. Look at the matrix first: it shows":
    "As outras métricas de classificação são razões entre essas quatro contagens. Comece pela matriz: ela mostra",
  which: "quais",
  "mistakes the model makes, not just how many.": "erros o modelo comete, não apenas quantos.",
  "The share of all predictions that are correct.": "A proporção de previsões corretas.",
  "Easy to read, and fine when classes are balanced and mistakes cost the same. With rare classes it lies: of 1,000 payments with 10 frauds, a model that":
    "Fácil de interpretar e adequada com classes equilibradas e custos iguais. Com classes raras, engana: em 1.000 pagamentos com 10 fraudes, um modelo que",
  always: "sempre",
  'says "not fraud" is': "prevê ausência de fraude tem",
  "accurate — and catches none of them.": "de acurácia e não detecta nenhuma fraude.",
  "exam model at {0}": "modelo de provas em {0}",
  'Fraud: always "not fraud"': "Fraude: sempre prevê ausência de fraude",
  "Precision and recall": "Precisão e sensibilidade",
  Precision: "Precisão",
  ": of everything predicted positive, how much really is.":
    ": entre as previsões positivas, quantas são realmente positivas.",
  Recall: "Sensibilidade (recall)",
  "(sensitivity, true-positive rate): of everything really positive, how much was caught.":
    "(taxa de verdadeiros positivos): entre os casos realmente positivos, quantos foram detectados.",
  'They pull against each other. Raise the threshold and the model only says "pass" when sure: precision rises, recall falls. Favour precision when false alarms are costly (spam filters), recall when misses are (cancer screening).':
    "Elas competem. Aumente o limiar e o modelo só prevê aprovação com confiança: precisão sobe, sensibilidade cai. Priorize precisão quando alarmes falsos custam caro (spam) e sensibilidade quando omissões custam caro (rastreamento de câncer).",
  "F1 score": "Escore F1",
  "The harmonic mean of precision and recall — high only when":
    "A média harmônica entre precisão e sensibilidade, alta apenas quando",
  both: "ambas",
  "are high. Fβ generalizes it: β > 1 weighs recall more, β < 1 weighs precision more.":
    "são altas. Fβ generaliza: β > 1 dá mais peso à sensibilidade; β < 1, à precisão.",
  "One number to compare models or pick a threshold when you care about both kinds of mistake. Here F1 peaks at a threshold of":
    "Um número para comparar modelos ou escolher um limiar quando os dois tipos de erro importam. Aqui F1 atinge o máximo no limiar",
  "). With more than two classes, average per-class F1 equally (macro) or pool every decision (micro).":
    "). Com mais de duas classes, faça a média dos F1 por classe (macro) ou reúna todas as decisões (micro).",
  "ROC curve and AUC": "Curva ROC e AUC",
  "The ROC curve plots the true-positive rate against the false-positive rate for":
    "A curva ROC relaciona a taxa de verdadeiros positivos à taxa de falsos positivos para",
  every: "todos os",
  "threshold at once. AUC is the area under it: the chance that a random student who passed gets a higher score than a random one who failed.":
    "limiares de uma vez. AUC é a área sob a curva: a chance de um aluno aprovado receber uma pontuação maior que um reprovado, ambos escolhidos ao acaso.",
  "It judges the scores themselves, before any threshold is picked. 0.5 is a coin flip (the dashed diagonal), 1 is a perfect ranking; this model reaches":
    "Ela avalia as pontuações antes da escolha de limiar. 0,5 equivale ao acaso (diagonal tracejada); 1 indica ordenação perfeita. Este modelo atinge",
  ". Your current threshold sits at FPR": ". Seu limiar atual está em FPR",
  "coin flip": "acaso",
  "False-positive rate": "Taxa de falsos positivos",
  "True-positive rate": "Taxa de verdadeiros positivos",
  "Precision–recall curve and average precision": "Curva precisão–sensibilidade e precisão média",
  "Precision against recall across every threshold. Average precision (AP) summarizes it as one area, like AUC does for ROC.":
    "Precisão contra sensibilidade em todos os limiares. A precisão média (AP) resume a curva como uma área, assim como AUC faz para ROC.",
  "ROC can look flattering when negatives vastly outnumber positives, because the false-positive rate barely moves. The PR curve ignores true negatives, so it shows how a rare-class detector really performs. A random model scores the positive rate (":
    "ROC pode parecer boa quando os negativos superam muito os positivos, pois FPR quase não muda. A curva PR ignora os verdadeiros negativos, revelando o desempenho na classe rara. Um modelo aleatório obtém a proporção de positivos (",
  ", dashed); this one reaches AP": ", tracejada); este atinge AP",
  "precision–recall": "precisão–sensibilidade",
  "random model": "modelo aleatório",
  "How much probability the model gave to the true answer, on a log scale — the same cross-entropy that training minimizes.":
    "A probabilidade atribuída à resposta verdadeira em escala logarítmica: a mesma entropia cruzada minimizada no treino.",
  "It rewards being right": "Ela recompensa acertar",
  "calibrated: a confident wrong answer (p near 0 for what happened) costs almost unboundedly. Always guessing 50% scores ln 2 ≈ 0.69; this model scores":
    "ter probabilidades calibradas: um erro confiante (p próximo de 0 para o que ocorreu) tem custo quase ilimitado. Prever sempre 50% resulta em ln 2 ≈ 0,69; este modelo obtém",
  ". Lower is better.": ". Menor é melhor.",
  "penalty for the true class": "penalidade para a classe verdadeira",
  "Probability given to what actually happened": "Probabilidade atribuída ao que realmente ocorreu",
  "this model": "este modelo",
  "always 50%": "sempre 50%",
  "How often is it right?": "Com que frequência acerta?",
  "Classes are balanced and mistakes cost the same.":
    "Classes equilibradas e custos de erro iguais.",
  "When it says yes, is it right?": "Quando diz sim, está certo?",
  "False alarms are expensive (spam, recommendations).":
    "Alarmes falsos são caros (spam, recomendações).",
  "Does it find all the positives?": "Encontra todos os positivos?",
  "Misses are expensive (disease, fraud, safety).":
    "Omissões são caras (doença, fraude, segurança).",
  "Balance of precision and recall?": "Equilíbrio entre precisão e sensibilidade?",
  "Both errors matter; one number to tune a threshold.":
    "Os dois erros importam; um número para ajustar o limiar.",
  "Does it rank positives above negatives?": "Ordena positivos acima dos negativos?",
  "Comparing models before choosing a threshold.": "Comparar modelos antes de escolher um limiar.",
  "Average precision": "Precisão média",
  "How good is it on the rare class?": "Qual é o desempenho na classe rara?",
  "Heavy class imbalance.": "Grande desequilíbrio entre classes.",
  "Are its probabilities trustworthy?": "Suas probabilidades são confiáveis?",
  "The probabilities themselves drive decisions.": "As probabilidades orientam as decisões.",
  'students, hours studied vs. passing (Wikipedia, "Logistic regression"). The fraud example is constructed to show the accuracy trap.':
    'alunos, horas de estudo versus aprovação (Wikipedia, "Logistic regression"). O exemplo de fraude demonstra a armadilha da acurácia.',
  "Clustering has no answer key: nobody told the algorithm which groups exist. So most clustering metrics are":
    "No agrupamento, não há gabarito: ninguém informou ao algoritmo quais grupos existem. Por isso, a maioria das métricas é",
  internal: "interna",
  "— they judge the shape of the groups themselves: tight inside, far apart from each other. When true labels happen to exist,":
    "— avalia a forma dos grupos: coesos por dentro e separados entre si. Quando há rótulos verdadeiros, métricas",
  external: "externas",
  "metrics can check the groups against them.": "podem compará-los aos grupos.",
  "The running example is k-means on": "O exemplo usa k-means nas dimensões das pétalas de",
  "Iris flowers' petal sizes, as in ML Components. Each metric is computed for several values of k — choosing k is the question most of them help answer.":
    "flores Iris, como em Componentes de ML. Calculamos cada métrica para vários valores de k: escolher k é a pergunta que a maioria ajuda a responder.",
  "cluster {0}": "grupo {0}",
  "Inertia and the elbow": "Inércia e o cotovelo",
  "Inertia (within-cluster sum of squares) is the total squared distance from each point to its cluster's centre — exactly what k-means minimizes.":
    "Inércia (soma dos quadrados dentro dos grupos) é a distância quadrática total de cada ponto ao centroide do seu grupo: exatamente o que k-means minimiza.",
  "It always falls as k grows (with k = n every point is its own centre), so it can't pick k by itself. Instead look for the":
    "Ela sempre diminui conforme k cresce (com k = n, cada ponto é seu próprio centroide), então não escolhe k sozinha. Procure o",
  elbow: "cotovelo",
  ": the k after which extra clusters stop buying much. Here the drop flattens after k =":
    ": o valor de k após o qual novos grupos acrescentam pouco. Aqui a queda suaviza após k =",
  "Silhouette score": "Escore de silhueta",
  "For each point: a = its mean distance to its own cluster, b = its mean distance to the nearest other cluster. Its silhouette compares the two, from −1 (wrong cluster) through 0 (on the border) to 1 (clearly placed). The score is the mean over all points.":
    "Para cada ponto: a = distância média ao próprio grupo; b = distância média ao outro grupo mais próximo. A silhueta compara as duas, de −1 (grupo errado), passando por 0 (na fronteira), até 1 (bem posicionado). O escore é a média de todos os pontos.",
  "It rewards both tightness and separation, and the per-point plot shows":
    "Ela recompensa coesão e separação; o gráfico por ponto revela quais",
  "points sit uneasily. The tall bars are the well-separated setosa cluster; the short ones are versicolor and virginica, which overlap. The mean is highest at k =":
    "pontos estão mal posicionados. As barras altas são setosa, bem separada; as baixas são versicolor e virginica, que se sobrepõem. A média é maior em k =",
  ": setosa on its own against the other two species merged — the most clearly separated split, though not the true number of species.":
    ": setosa sozinha e as outras duas espécies juntas. É a divisão mais nítida, embora não corresponda ao número real de espécies.",
  "silhouette, k = {0}": "silhueta, k = {0}",
  "Each flower, grouped by cluster (k = {0})": "Cada flor, por grupo (k = {0})",
  "mean silhouette": "silhueta média",
  "Davies–Bouldin index": "Índice Davies–Bouldin",
  "For each cluster, find its most similar neighbour: the ratio of their combined spread to the distance between their centres. Average that worst case over all clusters.":
    "Para cada grupo, encontre o vizinho mais semelhante: a razão entre a dispersão combinada e a distância entre centroides. Calcule a média desse pior caso entre os grupos.",
  "Cheap to compute (centres only, no all-pairs distances) and easy to read:":
    "Barato de calcular (apenas centroides, sem distâncias entre todos os pares) e fácil de ler:",
  lower: "menor",
  "is better, 0 is ideal. Here it prefers k =": "é melhor; 0 é ideal. Aqui prefere k =",
  ", silhouette prefers": ", a silhueta prefere",
  "and the elbow suggests": "e o cotovelo sugere",
  ': each metric encodes its own idea of a "good" cluster, so read several together.':
    ": cada métrica expressa sua própria ideia de um bom grupo, então leia várias em conjunto.",
  "Davies–Bouldin (lower is better)": "Davies–Bouldin (menor é melhor)",
  "Calinski–Harabasz index": "Índice Calinski–Harabasz",
  "The variance ratio criterion: spread": "O critério da razão de variâncias: dispersão",
  between: "entre",
  "cluster centres divided by spread": "centroides dividida pela dispersão",
  within: "dentro dos",
  "clusters, each scaled by its degrees of freedom.":
    "grupos, ambas ajustadas pelos graus de liberdade.",
  "Fast, and": "Rápido, e",
  higher: "maior",
  "is better. Like inertia it is built on squared distances, so it favours round, similar-sized clusters — fine for k-means, misleading for long or oddly-shaped groups. Highest here at k =":
    "é melhor. Como a inércia, usa distâncias quadráticas, favorecendo grupos arredondados e de tamanho semelhante. Adequado para k-means, mas enganoso para grupos alongados ou irregulares. O máximo aqui ocorre em k =",
  "External metrics: purity and adjusted Rand index":
    "Métricas externas: pureza e índice Rand ajustado",
  "When true labels exist, compare against them. Purity: the share of points that belong to their cluster's majority label. Adjusted Rand index (ARI): how often pairs of points are grouped the same way in both, corrected so random clusters score about 0.":
    "Quando há rótulos verdadeiros, compare com eles. Pureza: proporção de pontos com o rótulo majoritário do seu grupo. Índice Rand ajustado (ARI): frequência com que pares de pontos são agrupados da mesma forma, corrigida para que grupos aleatórios obtenham cerca de 0.",
  "They test whether the clusters found the categories you care about. Purity is easy to game (k = n gives 100%); ARI is not, and peaks at k =":
    "Elas verificam se os grupos capturam as categorias relevantes. Pureza é fácil de inflar (k = n dá 100%); ARI não, e atinge seu máximo em k =",
  "— the true number of species. Real clustering problems rarely have labels, which is why the internal metrics above exist.":
    "— o número real de espécies. Problemas reais de agrupamento raramente têm rótulos; por isso existem as métricas internas.",
  "purity, k = {0}": "pureza, k = {0}",
  "cluster ↓ / species →": "grupo ↓ / espécie →",
  cluster: "grupo",
  "adjusted Rand index": "índice Rand ajustado",
  "ARI vs species": "ARI versus espécies",
  "Inertia / elbow": "Inércia / cotovelo",
  "How compact are the clusters?": "Os grupos são compactos?",
  "Choosing k for k-means; never on its own.": "Escolher k para k-means; nunca isoladamente.",
  "Is each point closer to its own cluster?": "Cada ponto está mais perto do próprio grupo?",
  "Choosing k; spotting badly placed points.": "Escolher k; encontrar pontos mal posicionados.",
  "Do clusters overlap their neighbours?": "Os grupos se sobrepõem aos vizinhos?",
  "Fast check on large data; lower is better.":
    "Verificação rápida em grandes volumes; menor é melhor.",
  "Between- vs within-cluster spread?": "Dispersão entre grupos versus dentro deles?",
  "Fast check for round, similar-sized clusters.":
    "Verificação rápida para grupos arredondados e semelhantes.",
  "Purity / ARI": "Pureza / ARI",
  "Do clusters match known labels?": "Os grupos correspondem aos rótulos conhecidos?",
  "Benchmarking when ground truth exists.": "Avaliação quando há uma referência verdadeira.",
  "The shape a solution can take — a tree, a line, a network, a set of centroids.":
    "A forma que uma solução pode assumir: árvore, reta, rede ou conjunto de centroides.",
  "How it searches for good parameter values within that shape.":
    "Como busca bons valores de parâmetros dentro dessa forma.",
  "How we judge what it found — a different measure for every kind of task.":
    "Como avaliamos o resultado: uma medida diferente para cada tarefa.",
  "Predict one of a fixed set of categories. Our dataset: Normal or At Risk.":
    "Prever uma categoria de um conjunto fixo. Nos nossos dados: Normal ou Em risco.",
  "Predict a continuous number, e.g. a house's sale price.":
    "Prever um número contínuo, como o preço de venda de uma casa.",
  "Group similar observations with no labels at all, e.g. flowers by petal size — discover the categories, don't predict them.":
    "Agrupar observações semelhantes sem rótulos, como flores pelo tamanho das pétalas: descobrir as categorias, não prevê-las.",
  "ML is composed": "ML é formado",
  "of 3 components": "por 3 componentes",
  "\"A computer program is said to learn from experience E with respect to some class of tasks T and performance measure P, if its performance at tasks in T, as measured by P, improves with experience E.\" Tom Mitchell wrote that definition in 1997, and it still holds: a machine learning algorithm isn't one thing, it's a composite of three independent pieces.":
    "Segundo a definição de Tom Mitchell (1997), um programa aprende com a experiência E em tarefas T, avaliadas pela medida P, quando seu desempenho nessas tarefas melhora com E. A definição continua válida: um algoritmo de aprendizado de máquina combina três partes independentes.",
  "Cover of Tom M. Mitchell's 1997 textbook, Machine Learning":
    "Capa do livro Machine Learning, de Tom M. Mitchell, publicado em 1997",
  "This chapter uses a three-part reading of that definition — Representation, Optimization, Evaluation — popularized by Miller (2017). Sections 1–3 take the network from the Machine Learning page apart; section 4 does the same for three classic algorithms.":
    "Este capítulo usa uma leitura em três partes dessa definição: Representação, Otimização e Avaliação, popularizada por Miller (2017). As seções 1–3 detalham a rede da página Aprendizado de máquina; a seção 4 faz o mesmo com três algoritmos clássicos.",
  "What's being learned?": "O que está sendo aprendido?",
  "The three components look different depending on the task. The most common ones:":
    "Os três componentes mudam conforme a tarefa. As mais comuns:",
  '(And others — ranking, generation, reinforcement learning. Representation, Optimization and Evaluation look different for each, but every technique still has exactly these three parts.) Our machines are a classification task — the three sections below walk through the network\'s own Representation, Optimization and Evaluation, then "Other examples" works the same split for a decision tree, linear regression and clustering, each on its classic dataset.':
    "Há outras tarefas: ordenação, geração e aprendizado por reforço. Representação, Otimização e Avaliação mudam em cada uma, mas toda técnica mantém essas três partes. Nossas máquinas são uma tarefa de classificação: as próximas seções detalham os três componentes da rede; depois, Outros exemplos faz o mesmo para árvore de decisão, regressão linear e agrupamento.",
  Representation: "Representação",
  'Representation is the shape a solution is allowed to take — the template the search process fills in. A neural network\'s representation is a graph of interconnected nodes organized in layers, each connection carrying its own weight. On the Machine Learning page, every control in "Hidden layers" and "Activation" is a Representation choice: how many layers, how many neurons each, and which activation function. None of that depends on training. The network below has never seen a single example — these are its starting, randomly seeded weights and biases, drawn only to the shape':
    "Representação é a forma permitida para uma solução: o molde preenchido pela busca. Uma rede neural é um grafo de nós conectados em camadas, com um peso em cada conexão. Na página Aprendizado de máquina, Camadas ocultas e Ativação definem a representação: quantas camadas, quantos neurônios e qual ativação. Isso independe do treino. A rede abaixo nunca viu um exemplo: são os pesos e vieses iniciais aleatórios, organizados apenas na forma",
  'hidden / sigmoid output — chosen before training starts. A tree of questions, a straight line or a handful of centre points would each be a different representation, able to express a different family of answers ("Other examples" below draws each one).':
    "nas camadas ocultas / sigmoide na saída, escolhidos antes do treino. Uma árvore de perguntas, uma reta ou alguns centroides seriam outras representações, capazes de expressar famílias diferentes de respostas (mostradas em Outros exemplos).",
  Optimization: "Otimização",
  "Optimization doesn't choose the shape — it searches the space that Representation already defined, guided by one function to minimize or maximize. A neural network uses gradient-based search: backpropagation. For this network the function being minimized is binary cross-entropy — compute how far the output was from the true label, then push that error backwards through the layers with the chain rule to get each weight's share of the blame.":
    "A otimização busca no espaço definido pela representação, guiada por uma função a minimizar ou maximizar. A rede neural usa gradientes e retropropagação. Aqui minimizamos a entropia cruzada binária: medimos a distância entre a saída e o rótulo verdadeiro, propagamos o erro para trás pela regra da cadeia e calculamos a contribuição de cada peso.",
  "Every weight moves a little in the direction that lowers L. Pressing Step on the Machine Learning page runs this update once; Train repeats it. The learning rate, the batch size, and how many epochs to run are all details of how the search takes its steps — they don't change what the network can represent, only how well it finds a good setting within it.":
    "Cada peso se move um pouco na direção que reduz L. O botão Passo executa essa atualização uma vez; Treinar a repete. Taxa de aprendizado, tamanho do lote e número de épocas definem os passos da busca. Eles alteram a qualidade da solução encontrada, sem mudar o que a rede pode representar.",
  "Evaluation — the measure": "Avaliação: a medida",
  "A candidate solution is only as good as the function used to judge it, and that function depends on the task being learned. Our dataset is a classification task, so the measure here is accuracy: the share of machines correctly classified. After 300 epochs of the exact optimization process above, this network reaches":
    "Uma solução depende da função usada para avaliá-la, que depende da tarefa. Nosso conjunto é de classificação, então usamos acurácia: a proporção de máquinas classificadas corretamente. Após 300 épocas do processo acima, esta rede atinge",
  ") — the hand-written rules from the Programming page get":
    "); as regras manuais da página Programação obtêm",
  "). Same measure, two different programs.": "). A mesma medida, dois programas diferentes.",
  'Accuracy only applies because this is classification — a regression task would use mean squared error instead, and clustering has no true label to compare against at all. "Other examples" below computes each of those measures for real.':
    "A acurácia se aplica porque isto é classificação. Regressão usaria erro quadrático médio, enquanto agrupamento não tem rótulos verdadeiros para comparar. Outros exemplos calcula essas medidas.",
  "Other examples": "Outros exemplos",
  "The same Representation / Optimization / Evaluation split, worked for three classic algorithms, each on the dataset it is usually taught with, plus the network above, summarized for comparison. One per task type: classification, regression, clustering.":
    "A mesma divisão entre Representação, Otimização e Avaliação para três algoritmos clássicos, cada um com seu conjunto de dados habitual, e a rede acima resumida para comparação. Uma tarefa de cada tipo: classificação, regressão e agrupamento.",
  "Why this split matters": "Por que essa divisão importa",
  'The rest of this chapter zooms in on Evaluation: what goes wrong when a model is too simple or too flexible (bias and variance), whom it treats unfairly (bias and fairness), and one lesson per family of metrics. The chapter after studies one Representation — the neural network — in depth, and its own lessons fall along the same seam: "Back-propagation" is Optimization, "Loss & Optimization" is Evaluation and Optimization named almost literally. Every technique later in this course, through transformers and agents, is still a choice of these same three ingredients.':
    "O restante do capítulo aprofunda a Avaliação: modelos simples ou flexíveis demais (viés e variância), tratamento desigual (viés e equidade) e famílias de métricas. O próximo capítulo estuda uma Representação, a rede neural, em profundidade: Retropropagação é Otimização; Perda e Otimização reúne esses dois componentes. Até transformadores e agentes, toda técnica combina os mesmos três ingredientes.",
  "Historical bias": "Viés histórico",
  "The world the data records was already unequal; a faithful model reproduces it.":
    "O mundo registrado nos dados já era desigual; um modelo fiel o reproduz.",
  "Representation bias": "Viés de representação",
  "Some groups are under-sampled, so the model learns them less well.":
    "Alguns grupos têm poucas amostras e o modelo aprende menos sobre eles.",
  "Measurement bias": "Viés de medição",
  "Features or labels are proxies that work worse for some groups — like a credit score built on history some people never had.":
    "Variáveis ou rótulos são aproximações que funcionam pior para certos grupos, como uma pontuação de crédito baseada em um histórico que algumas pessoas nunca tiveram.",
  "Aggregation bias": "Viés de agregação",
  "One model for everyone, when the pattern genuinely differs between groups.":
    "Um único modelo para todos, mesmo quando os padrões diferem entre grupos.",
  "Evaluation bias": "Viés de avaliação",
  "Benchmarks or metrics that don't reflect the people the model will serve.":
    "Referências ou métricas que não representam as pessoas atendidas pelo modelo.",
  "Group A {0}": "Grupo A {0}",
  "Group B {0}": "Grupo B {0}",
  '"Bias" also has an everyday meaning: a model that treats groups of people differently. A model can be accurate overall and still approve one group far less often, or miss far more of its qualified members. Fairness metrics make those differences measurable — and show that they can\'t all be zero at once.':
    "Viés também tem um sentido cotidiano: um modelo que trata grupos de pessoas de formas diferentes. Ele pode ter boa acurácia geral e aprovar um grupo com muito menos frequência, ou recusar mais pessoas qualificadas. Métricas de equidade tornam essas diferenças mensuráveis e mostram que não é possível zerá-las todas ao mesmo tempo.",
  "The running example is synthetic and illustrative:": "O exemplo é sintético e ilustrativo:",
  "loan applicants from two groups, A and B, each with a credit score from 0 to 1. Group A repaid":
    "solicitantes de empréstimo em dois grupos, A e B, com pontuação de crédito entre 0 e 1. O grupo A pagou em",
  "of the time, group B": "dos casos; o grupo B, em",
  ", and the score under-rates B's repayers. The bank approves everyone above one threshold — drag it and watch every metric move.":
    ", e a pontuação subestima quem pagou no grupo B. O banco aprova todos acima de um limiar: arraste e observe as métricas.",
  "Where bias comes from": "De onde vem o viés",
  "After Suresh & Guttag (2021).": "Adaptado de Suresh e Guttag (2021).",
  "Group A repaid": "Grupo A: pagou",
  "Group B repaid": "Grupo B: pagou",
  "defaulted (both)": "inadimplentes (ambos)",
  "Credit score": "Pontuação de crédito",
  "accuracy, group A": "acurácia, grupo A",
  "accuracy, group B": "acurácia, grupo B",
  "Demographic parity": "Paridade demográfica",
  "The selection rate — the share of each group that gets approved — should be equal, regardless of who would actually repay.":
    "A taxa de seleção, proporção aprovada em cada grupo, deve ser igual, independentemente de quem pagaria o empréstimo.",
  "Simple, needs no labels, and matches the legal idea of equal outcomes. But when base rates genuinely differ, forcing equal approval means approving unequal risks. Gap now:":
    "Simples, dispensa rótulos e corresponde à ideia de igualdade de resultados. Mas, com taxas-base diferentes, igualar aprovações implica aprovar riscos diferentes. Diferença atual:",
  "selection rate": "taxa de seleção",
  "Share approved": "Proporção aprovada",
  "Disparate impact ratio": "Razão de impacto adverso",
  "The lower group's selection rate divided by the higher group's: demographic parity as a ratio instead of a gap.":
    "A menor taxa de seleção dividida pela maior: paridade demográfica expressa como razão, em vez de diferença.",
  'US employment guidance flags a ratio below 0.8 — the "four-fifths rule" — as evidence of adverse impact. A quick, widely recognised screen; not proof of fairness or unfairness on its own.':
    "A orientação de emprego dos EUA sinaliza razões abaixo de 0,8, a regra dos quatro quintos, como indício de impacto adverso. É uma triagem rápida e conhecida, não uma prova isolada de equidade ou discriminação.",
  "disparate impact": "impacto adverso",
  "four-fifths rule": "regra dos quatro quintos",
  "0.8 line": "linha de 0,8",
  "B ÷ A selection rate": "Taxa de seleção B ÷ A",
  "Equal opportunity": "Igualdade de oportunidade",
  "Among applicants who": "Entre solicitantes que",
  would: "pagariam",
  "repay, each group should be approved at the same rate: equal true-positive rates.":
    "o empréstimo, cada grupo deve ter a mesma taxa de aprovação: taxas de verdadeiros positivos iguais.",
  "It focuses on the harm of being wrongly turned away when you deserved a yes. Here a creditworthy applicant from B is approved":
    "Foca no dano de recusar injustamente quem merecia aprovação. Aqui, uma pessoa com capacidade de pagamento do grupo B é aprovada em",
  "of the time, versus": "dos casos, contra",
  "for A — the score's measurement bias, made visible.":
    "no grupo A: o viés de medição da pontuação fica visível.",
  "true-positive rate": "taxa de verdadeiros positivos",
  "Repayers approved": "Pagadores aprovados",
  "Equalized odds": "Igualdade de chances (equalized odds)",
  "Equal opportunity plus equal false-positive rates: both groups should share the same error rates on each side.":
    "Igualdade de oportunidade mais taxas de falsos positivos iguais: os dois grupos devem ter as mesmas taxas de erro em ambos os lados.",
  "Stricter: neither group gets more wrongful denials":
    "Mais rigorosa: nenhum grupo recebe mais recusas injustas",
  "more risky approvals. Usually reachable only with a different threshold per group — which may itself be legally restricted.":
    "aprovações arriscadas. Geralmente exige um limiar diferente por grupo, o que também pode ter restrições legais.",
  "false-positive rate": "taxa de falsos positivos",
  "Predictive parity": "Paridade preditiva",
  "An approval should mean the same thing in both groups: equal precision, the share of approved applicants who actually repay.":
    "Uma aprovação deve significar o mesmo nos dois grupos: precisão igual, a proporção de aprovados que realmente pagam.",
  "It is the lender's view of fairness — a given score should carry the same risk whoever holds it. It is what calibration-focused tools such as recidivism scores defended themselves with, while critics pointed to unequal error rates.":
    "É a visão do credor: a mesma pontuação deve indicar o mesmo risco para qualquer pessoa. Ferramentas focadas em calibração, como escores de reincidência, usaram esse argumento; críticos apontaram taxas de erro desiguais.",
  "Approved who repaid": "Aprovados que pagaram",
  "You can't have them all": "Não é possível satisfazer todas",
  "The gap in each criterion across every threshold. No single threshold closes all three at once.":
    "A diferença em cada critério ao longo dos limiares. Nenhum limiar elimina as três diferenças ao mesmo tempo.",
  "This isn't a flaw of this model. When base rates differ, predictive parity and equal error rates are mathematically incompatible unless the classifier is perfect (Kleinberg, Mullainathan & Raghavan, 2016; Chouldechova, 2017). Choosing a fairness metric is a value judgement about which harm matters most — made by people, not by the algorithm.":
    "Isso não é um defeito deste modelo. Com taxas-base diferentes, paridade preditiva e taxas de erro iguais são matematicamente incompatíveis, exceto com classificação perfeita (Kleinberg, Mullainathan e Raghavan, 2016; Chouldechova, 2017). Escolher uma métrica de equidade é decidir qual dano importa mais: uma escolha das pessoas.",
  "selection-rate gap": "diferença na taxa de seleção",
  "TPR gap": "diferença em TPR",
  "precision gap": "diferença de precisão",
  "Are groups approved at the same rate?": "Os grupos têm a mesma taxa de aprovação?",
  "Outcomes should be equal regardless of labels.":
    "Resultados devem ser iguais, independentemente dos rótulos.",
  "Disparate impact": "Impacto adverso",
  "Is the ratio of approval rates ≥ 0.8?": "A razão entre taxas de aprovação é ≥ 0,8?",
  "A quick regulatory screen.": "Uma triagem regulatória rápida.",
  "Are qualified people approved equally?": "Pessoas qualificadas são aprovadas igualmente?",
  "Wrongful denials are the main harm.": "Recusas injustas são o principal dano.",
  "Are both error rates equal?": "As duas taxas de erro são iguais?",
  "Both kinds of mistake carry harm.": "Os dois tipos de erro causam dano.",
  "Does a yes mean the same for everyone?": "Um sim significa o mesmo para todos?",
  "Decisions rely on the score's meaning.": "As decisões dependem do significado da pontuação.",
  "What it measures": "O que mede",
  "Why it matters": "Por que importa",
  "Cheat sheet": "Guia rápido",
  Metric: "Métrica",
  Answers: "Responde",
  "Reach for it when": "Use quando",
  "not relevant": "não relevante",
  "Search engines and recommenders don't answer with one label — they answer with an ordered list, and people mostly look at the top. Ranking metrics care about":
    "Buscadores e recomendadores retornam uma lista ordenada, e as pessoas olham principalmente o topo. As métricas de ordenação avaliam",
  where: "onde",
  "the good results land: a perfect answer at position 9 is worth far less than at position 1.":
    "os bons resultados aparecem: uma resposta perfeita na posição 9 vale muito menos que na posição 1.",
  "The running example is illustrative:": "O exemplo é ilustrativo:",
  'search queries, each answered with 10 results by two systems — a keyword ranker and a learned ranker. Human judges graded each result from 0 (not relevant) to 3 (perfect). Here is the first query, "':
    'consultas, cada uma com 10 resultados de dois sistemas: um ordenador por palavras-chave e um aprendido. Avaliadores humanos deram notas de 0 (não relevante) a 3 (perfeito). Aqui está a primeira consulta, "',
  "Precision@k": "Precisão@k",
  "Of the top k results, the share that are relevant (grade above 0).":
    "Entre os primeiros k resultados, a proporção relevante (nota acima de 0).",
  "It matches how people use a results page: only the first screen matters. It ignores order":
    "Reflete o uso de uma página de resultados: a primeira tela importa. Ignora a ordem",
  "the top k and how many relevant items exist overall.":
    "primeiros k e o total de itens relevantes disponíveis.",
  "k (results looked at)": "k (resultados vistos)",
  "Recall@k": "Sensibilidade@k",
  "Of all relevant items for the query, the share found in the top k.":
    "Entre todos os itens relevantes para a consulta, a proporção encontrada nos primeiros k.",
  "Matters when the user needs": "Importa quando o usuário precisa de",
  everything: "tudo",
  "— legal discovery, a literature search — or when a first-stage retriever must hand the right candidates to a later stage. It can only rise with k.":
    "— busca jurídica, revisão bibliográfica — ou quando uma etapa inicial deve entregar os candidatos certos à próxima. Só pode aumentar com k.",
  "Hit rate@k": "Taxa de acerto@k",
  "The share of queries with at least one relevant result in the top k.":
    "A proporção de consultas com ao menos um resultado relevante nos primeiros k.",
  'The everyday recommender metric ("did we show them anything useful?"), especially when each user has one item that counts — the next song, the next purchase.':
    "Uma métrica comum em recomendação: mostramos algo útil? Especialmente quando um item importa por usuário, como a próxima música ou compra.",
  "Mean reciprocal rank (MRR)": "Média do posto recíproco (MRR)",
  "For each query, 1 divided by the position of the first relevant result (1, ½, ⅓, …); then the mean over queries.":
    "Para cada consulta, 1 dividido pela posição do primeiro resultado relevante (1, ½, ⅓, …); depois, a média entre consultas.",
  'Ideal when one good answer is enough — question answering, navigational search ("open my bank\'s website"). It ignores everything after the first hit.':
    "Ideal quando uma boa resposta basta: perguntas e respostas ou busca de navegação (abrir o site do banco). Ignora tudo após o primeiro acerto.",
  "Reciprocal rank": "Posto recíproco",
  "Mean average precision (MAP)": "Média da precisão média (MAP)",
  "For each query, average the precision at every position that holds a relevant result, divided by the number of relevant items; then the mean over queries.":
    "Para cada consulta, some a precisão nas posições com resultados relevantes e divida pelo número de itens relevantes; depois calcule a média entre consultas.",
  "One number that rewards finding": "Um número que recompensa encontrar",
  all: "todos",
  "the relevant results": "os resultados relevantes",
  "putting them early. The long-standing standard in information retrieval benchmarks.":
    "colocá-los cedo. Um padrão tradicional em avaliações de recuperação de informação.",
  "Normalized discounted cumulative gain. Each result earns a gain from its grade (2^grade − 1), discounted by log₂ of its position; the sum is divided by the best possible sum for that query.":
    "Ganho cumulativo descontado normalizado. Cada resultado ganha 2^nota − 1, descontado por log₂ da posição. A soma é dividida pela melhor soma possível para a consulta.",
  "The only metric here that uses": "A única métrica aqui que combina relevância",
  graded: "graduada",
  "relevance — a perfect result counts more than a somewhat-relevant one — and position at once. From 0 to 1, comparable across queries; the standard for web search and modern recommenders.":
    "— um resultado perfeito vale mais que um parcialmente relevante — e posição. Vai de 0 a 1, permite comparação entre consultas e é padrão em busca na web e recomendação.",
  "Accuracy-style metrics aren't the whole story for recommenders. Teams also track":
    "Métricas de acerto não contam toda a história dos recomendadores. Equipes também acompanham",
  coverage: "cobertura",
  "(how much of the catalogue ever gets recommended),": "(quanto do catálogo é recomendado),",
  diversity: "diversidade",
  "(how different the items in one list are),": "(quão diferentes são os itens de uma lista),",
  novelty: "novidade",
  "(how unfamiliar they are to the user), and, online, the business outcome itself — clicks, watch time, purchases — through A/B tests.":
    "(quanto os itens são desconhecidos pelo usuário) e, online, os resultados de negócio: cliques, tempo assistido e compras, por testes A/B.",
  "How much of the first page is useful?": "Quanto da primeira página é útil?",
  "Users only see the top results.": "Usuários só veem os primeiros resultados.",
  "Did we find all the relevant items?": "Encontramos todos os itens relevantes?",
  "Completeness matters; candidate retrieval.": "Completude importa; recuperação de candidatos.",
  "Was anything useful shown?": "Foi mostrado algo útil?",
  "Recommenders with one target item.": "Recomendadores com um item-alvo.",
  "How soon is the first good answer?": "Quando aparece a primeira boa resposta?",
  "One answer is enough (QA, navigation).": "Uma resposta basta (perguntas, navegação).",
  "All relevant items, and early?": "Todos os relevantes, e cedo?",
  "Binary relevance, IR benchmarks.":
    "Relevância binária; avaliações de recuperação de informação.",
  "Best items at the very top?": "Os melhores itens estão no topo?",
  "Graded relevance: web search, recommenders.": "Relevância graduada: busca e recomendação.",
  "A regression model predicts a number, so it is never simply right or wrong — it is off by some amount. Regression metrics differ in how they add those amounts up: in the target's own units or as a percentage, and how harshly they punish a big miss.":
    "Um modelo de regressão prevê um número: não está simplesmente certo ou errado, mas erra por uma quantidade. As métricas diferem em como somam esses erros, nas unidades do alvo ou em porcentagem, e em quanto penalizam erros grandes.",
  "The running example is the house-price line from ML Components: price =":
    "O exemplo é a reta de preços de casas de Componentes de ML: preço =",
  "·area +": "·área +",
  ", fitted to": ", ajustada a",
  "illustrative sales (prices in thousands).": "vendas ilustrativas (preços em milhares).",
  "A residual is one prediction's error: actual − predicted. Above zero, the house sold for more than the line expected; below, for less.":
    "Um resíduo é o erro de uma previsão: real − previsto. Acima de zero, a casa foi vendida por mais que o esperado pela reta; abaixo, por menos.",
  "Every metric below is a summary of this list. Plot it before summarizing: a pattern (a curve, a funnel) means the model is missing structure, which no single number reveals. Here they scatter evenly around zero, as a good fit should.":
    "As métricas abaixo resumem essa lista. Faça o gráfico antes: um padrão (curva, funil) indica estrutura que o modelo não capturou, invisível em um único número. Aqui, os resíduos se espalham uniformemente ao redor de zero.",
  "Residual (k)": "Resíduo (k)",
  "Actual − predicted (k)": "Real − previsto (k)",
  "MAE — mean absolute error": "MAE — erro absoluto médio",
  "The average size of a miss, ignoring its direction, in the target's units.":
    "O tamanho médio do erro, ignorando a direção, nas unidades do alvo.",
  "The most readable metric: \"on average we're off by":
    'A métrica mais legível: "em média, erramos por',
  "\". Each error counts in proportion to its size, so one wild miss doesn't dominate — useful when outliers are noise rather than the point.":
    '". Cada erro conta proporcionalmente ao tamanho, então um erro extremo não domina. Útil quando valores atípicos são ruído.',
  "|error| per house (k)": "|erro| por casa (k)",
  "House, by floor area (m²)": "Casa, por área (m²)",
  "|error| (k)": "|erro| (k)",
  "MSE and RMSE": "MSE e RMSE",
  "MSE averages the": "MSE calcula a média dos erros",
  squared: "ao quadrado",
  "errors; RMSE takes its square root to return to the target's units.":
    "; RMSE extrai a raiz quadrada para voltar às unidades do alvo.",
  "Squaring makes big misses count far more than small ones. MSE is what least squares and gradient descent minimize; RMSE is how you report it. Add one 90 m² house that sold for":
    "Elevar ao quadrado faz erros grandes pesarem muito mais. MSE é minimizado por mínimos quadrados e descida do gradiente; RMSE comunica o resultado. Adicione uma casa de 90 m² vendida por",
  "k and RMSE jumps from": "k e RMSE salta de",
  ", while MAE only moves from": ", enquanto MAE só passa de",
  "14 sales": "14 vendas",
  "+ one outlier": "+ um valor atípico",
  "Error (k)": "Erro (k)",
  "MAPE — mean absolute percentage error": "MAPE — erro percentual absoluto médio",
  "The average miss as a percentage of the true value.":
    "O erro médio como porcentagem do valor verdadeiro.",
  'Scale-free, so it compares models across targets of different sizes ("within':
    'Independe da escala, permitindo comparar alvos de tamanhos diferentes ("dentro de',
  '%"). But it explodes when true values are near zero, and it punishes over-predictions more than under-predictions of the same size.':
    '%"). Mas explode perto de zero e penaliza mais previsões acima do valor real que abaixo dele, para erros de mesmo tamanho.',
  "% error per house": "% de erro por casa",
  "|error| / price (%)": "|erro| / preço (%)",
  "R² and adjusted R²": "R² e R² ajustado",
  "The share of the target's variation the model explains, compared with always predicting the average price. Adjusted R² discounts it for every extra input feature.":
    "A proporção da variação do alvo explicada pelo modelo, comparada a prever sempre o preço médio. R² ajustado desconta cada variável de entrada adicional.",
  "Unit-free and easy to compare: 1 is perfect, 0 is no better than the mean, below 0 is worse. Plain R² never drops when you add a feature, even a useless one, so adjusted R² is the fairer comparison between models of different sizes. Points on the dashed line are perfect predictions.":
    "Sem unidade e fácil de comparar: 1 é perfeito; 0 equivale à média; abaixo de 0 é pior. R² nunca cai ao adicionar uma variável, mesmo inútil; R² ajustado permite comparar modelos de tamanhos diferentes. Pontos na linha tracejada são previsões perfeitas.",
  "adjusted R²": "R² ajustado",
  "Actual price (k)": "Preço real (k)",
  "Predicted price (k)": "Preço previsto (k)",
  "How far off, on average?": "Qual é o erro médio?",
  "You want a readable error and outliers are noise.":
    "Você quer um erro legível e valores atípicos são ruído.",
  "What does training minimize?": "O que o treino minimiza?",
  "Optimizing; big errors are much worse than small ones.":
    "Otimização; erros grandes custam muito mais.",
  "Typical error, big misses weighted up?": "Erro típico com peso maior nos erros grandes?",
  "Reporting MSE in the target's units.": "Comunicar MSE nas unidades do alvo.",
  "How far off, in percent?": "Qual é o erro em porcentagem?",
  "Comparing across scales; targets never near zero.":
    "Comparar escalas; alvos nunca próximos de zero.",
  "R² / adjusted R²": "R² / R² ajustado",
  "How much variation is explained?": "Quanto da variação é explicado?",
  "Comparing models on the same data; adjusted for model size.":
    "Comparar modelos nos mesmos dados, ajustando o tamanho.",
  "greedy (ε = 0)": "guloso (ε = 0)",
  "Gridworld with the learned greedy action in each cell: S start, G goal, X pits.":
    "Mundo em grade com a ação gulosa aprendida em cada célula: S início, G objetivo, X buracos.",
  start: "início",
  "learning metrics": "métricas de aprendizado",
  "In reinforcement learning there is no answer key at all. An agent acts, the world hands back a reward, and the agent must learn which actions pay off — while it is still being scored. So RL metrics track reward":
    "No aprendizado por reforço não há gabarito. Um agente age, o mundo devolve uma recompensa, e ele aprende quais ações compensam enquanto é avaliado. As métricas de RL acompanham a recompensa",
  "over time": "ao longo do tempo",
  ": how much was earned, how much was lost while learning, and how quickly and reliably the agent got good.":
    ": quanto ganhou, quanto perdeu aprendendo e com que rapidez e consistência melhorou.",
  "Two classic examples. A": "Dois exemplos clássicos. Um",
  "multi-armed bandit": "bandido de múltiplos braços",
  ": five slot machines paying out with hidden probabilities (":
    ": cinco máquinas caça-níqueis com probabilidades ocultas (",
  "); the agent pulls one per step for": "); o agente escolhe uma por passo durante",
  "steps, averaged over 300 runs. A": "passos, com média de 300 execuções. Um",
  gridworld: "mundo em grade",
  ": Q-learning finds its way from start to goal around pits, for":
    ": Q-learning aprende a ir do início ao objetivo evitando buracos, durante",
  "episodes, averaged over 40 runs.": "episódios, com média de 40 execuções.",
  "Average reward per step": "Recompensa média por passo",
  "The reward the agent collects at each step, averaged across runs.":
    "A recompensa coletada a cada passo, na média das execuções.",
  'The most direct reading of "is it learning?". Each agent here explores with probability ε: always exploiting (ε = 0) locks onto the first machine and never finds a better one; exploring a little climbs towards the best payout of':
    "A resposta mais direta a está aprendendo? Cada agente explora com probabilidade ε: só aproveitar (ε = 0) prende-o à primeira máquina. Explorar um pouco aproxima-o do melhor retorno de",
  "; exploring a lot keeps paying for its curiosity.":
    "; explorar muito mantém o custo da curiosidade.",
  "Reward ({0}-step average)": "Recompensa (média de {0} passos)",
  "Cumulative regret": "Arrependimento acumulado",
  "The reward lost, summed over time, compared with an oracle that always pulled the best machine.":
    "A recompensa perdida ao longo do tempo, comparada a um oráculo que sempre escolhe a melhor máquina.",
  "It charges the agent for every exploratory or mistaken pull, so it measures the cost of learning itself. A flattening curve means the agent has stopped losing; a straight line means it never learned. Lower is better.":
    "Cobra cada escolha exploratória ou errada, medindo o custo do aprendizado. Uma curva que se estabiliza indica que o agente parou de perder; uma reta indica que não aprendeu. Menor é melhor.",
  "Optimal action rate": "Taxa de ação ótima",
  "The share of runs that chose the best machine at each step.":
    "A proporção de execuções que escolheu a melhor máquina em cada passo.",
  'Separates "picks the right action" from "got lucky with a payout". It is only available in a simulation where you know the best action — in the real world you rarely do.':
    "Distingue escolher a ação certa de ter sorte no retorno. Só está disponível em simulações com a melhor ação conhecida; no mundo real, raramente sabemos qual é.",
  "Best machine chosen": "Melhor máquina escolhida",
  "Episode return": "Retorno por episódio",
  "Many tasks come in episodes — a game, a trip from start to goal. The return is the total reward of one episode: here −1 per step, +10 at the goal, −10 in a pit. Training itself maximizes the":
    "Muitas tarefas têm episódios: um jogo, um trajeto até o objetivo. Retorno é a recompensa total do episódio: aqui −1 por passo, +10 no objetivo, −10 no buraco. O treino maximiza o retorno",
  discounted: "descontado",
  "return, which values sooner rewards more.": ", que dá mais valor às recompensas próximas.",
  "The headline metric of most RL papers: plot it per episode (smoothed — single episodes are noisy) and it should rise and level off. The arrows show the action this agent settled on in each cell.":
    "A principal métrica em muitos artigos de RL: trace por episódio, suavizando o ruído, e observe a subida e estabilização. As setas mostram a ação aprendida em cada célula.",
  "Return ({0}-episode average)": "Retorno (média de {0} episódios)",
  "Episode length": "Duração do episódio",
  "Steps taken per episode, until the goal, a pit, or the step limit.":
    "Passos por episódio até o objetivo, um buraco ou o limite de passos.",
  'For "get there" tasks, shorter is better, and comparing against the best possible path (':
    "Para tarefas de navegação, menor é melhor. Comparar com o melhor caminho possível (",
  "steps here) shows how close to optimal the agent is. It ends at about":
    "passos aqui) revela a proximidade do ótimo. Termina em cerca de",
  "steps.": "passos.",
  "steps per episode": "passos por episódio",
  "shortest path": "caminho mais curto",
  "Success rate and sample efficiency": "Taxa de sucesso e eficiência amostral",
  "Success rate: the share of episodes that reach the goal. Sample efficiency: how much experience it takes to get there — here, episodes until the smoothed success rate first reaches":
    "Taxa de sucesso: proporção de episódios que chegam ao objetivo. Eficiência amostral: experiência necessária para isso, aqui o número de episódios até a taxa de sucesso suavizada atingir",
  "Success is what a user cares about; sample efficiency is what a robot or a simulator budget cares about. It never reaches 100% here: the agent still explores 10% of the time, and a random step next to a pit can be fatal. Always report results over several random seeds — RL is notoriously variable from run to run.":
    "Sucesso importa para o usuário; eficiência amostral importa para o custo do robô ou simulador. Aqui não chega a 100%: o agente ainda explora em 10% dos passos, e um passo aleatório perto de um buraco pode encerrar o episódio. Use várias sementes aleatórias: RL varia muito entre execuções.",
  "episodes to {0}": "episódios até {0}",
  "last {0} episodes": "últimos {0} episódios",
  "success rate": "taxa de sucesso",
  "Success ({0}-episode average)": "Sucesso (média de {0} episódios)",
  "Average reward": "Recompensa média",
  "Is it earning more over time?": "Ganha mais ao longo do tempo?",
  "Continuing tasks with no episodes.": "Tarefas contínuas sem episódios.",
  "What did learning cost?": "Qual foi o custo de aprender?",
  "Bandits, online systems (ads, A/B tests).": "Bandidos, sistemas online (anúncios, testes A/B).",
  "Does it pick the best action?": "Escolhe a melhor ação?",
  "Simulations where the best action is known.": "Simulações com a melhor ação conhecida.",
  "How good is a whole episode?": "Qual é a qualidade de um episódio inteiro?",
  "Games, control, most RL benchmarks.": "Jogos, controle, avaliações de RL.",
  "How fast does it finish?": "Quanto tempo leva para terminar?",
  "Navigation and other get-there tasks.": "Navegação e outras tarefas com destino.",
  "Success rate / sample efficiency": "Taxa de sucesso / eficiência amostral",
  "Does it succeed, and how soon?": "Consegue alcançar o objetivo, e quando?",
  "Goal tasks; costly real-world experience.": "Tarefas com objetivos e experiência real cara.",
  Initialize: "Inicializar",
  Backpropagation: "Retropropagação",
  Repeat: "Repetir",
  Logic: "Lógica",
  Knowledge: "Conhecimento",
  Adaptation: "Adaptação",
  Explainability: "Interpretabilidade",
  Train: "Treinar",
  Pause: "Pausar",
  Play: "Executar",
  Epoch: "Época",
  INPUT: "ENTRADA",
  OUTPUT: "SAÍDA",
  no: "não",
  Normal: "Normal",
  "At Risk": "Em risco",
  Regression: "Regressão",
  Clustering: "Agrupamento",
  Evaluation: "Avaliação",
  Source: "Fonte",
  Summary: "Resumo",
  metrics: "métricas",
  Ranking: "Ordenação",
  Reinforcement: "Reforço",
  fairness: "equidade",
  Hide: "Ocultar",
  Silhouette: "Silhueta",
  Threshold: "Limiar",
  Degree: "Grau",
  truth: "verdade",
  High: "Alto",
  Low: "Baixo",
  high: "alta",
  low: "baixa",
  pass: "aprovado",
  fail: "reprovado",
  Pass: "Aprovado",
  Fail: "Reprovado",
  Yes: "Sim",
  No: "Não",
  outlook: "condição do tempo",
  temperature: "temperatura",
  humidity: "umidade",
  wind: "vento",
  Sunny: "Ensolarado",
  Overcast: "Nublado",
  Rain: "Chuva",
  Hot: "Quente",
  Mild: "Ameno",
  Cool: "Frio",
  Strong: "Forte",
  Weak: "Fraco",
  "Keyword ranker": "Ordenador por palavras-chave",
  "Learned ranker": "Ordenador aprendido",
  somewhat: "parcialmente relevante",
  relevant: "relevante",
  perfect: "perfeito",
  "laptop for students": "notebook para estudantes",
  "cheap flights to lisbon": "voos baratos para Lisboa",
  "how to fix a flat tyre": "como consertar um pneu furado",
  "python sort dictionary": "ordenar dicionário em Python",
  Topics: "Tópicos",
  "Time step": "Passo de tempo",
  Episode: "Episódio",
  Reward: "Recompensa",
  Regret: "Arrependimento",
  Return: "Retorno",
  Inertia: "Inércia",
  Purity: "Pureza",
  Residuals: "Resíduos",
  Temp: "Temp",
  Vib: "Vib",
  "Share of all predictions that are right. Misleading when one class is rare.":
    "Proporção de previsões corretas. Enganosa quando uma classe é rara.",
  "Of the predicted positives, how many are real. Watch it when false alarms cost.":
    "Entre os positivos previstos, quantos são reais. Importa quando alarmes falsos custam caro.",
  "Of the real positives, how many were caught. Watch it when misses cost.":
    "Entre os positivos reais, quantos foram detectados. Importa quando omissões custam caro.",
  "Harmonic mean of precision and recall: one number, high only if both are.":
    "Média harmônica de precisão e sensibilidade: alta apenas se ambas forem altas.",
  "Chance a random positive scores above a random negative. Ranking quality, any cut-off.":
    "Chance de um positivo ter pontuação maior que um negativo aleatório. Qualidade da ordenação em qualquer corte.",
  "Average miss, in the target's units. Treats every error alike, so robust to outliers.":
    "Erro médio nas unidades do alvo. Pesa erros proporcionalmente, sendo menos sensível a valores atípicos.",
  "Average squared miss: what training minimizes. Squared units, hard to read directly.":
    "Erro quadrático médio: minimizado no treino. Usa unidades ao quadrado, menos fáceis de interpretar.",
  "√MSE, back in the target's units. Punishes big misses more than MAE.":
    "√MSE, nas unidades do alvo. Penaliza erros grandes mais que MAE.",
  "Average miss as a % of the true value. Compares across scales; breaks near zero.":
    "Erro médio como porcentagem do valor real. Compara escalas, mas falha perto de zero.",
  "Share of the variation explained, vs. always predicting the mean. 1 = perfect.":
    "Proporção da variação explicada em relação a prever sempre a média. 1 = perfeito.",
  "How much closer each point is to its own cluster than the next. Higher is better.":
    "Quanto cada ponto está mais próximo do próprio grupo que do próximo. Maior é melhor.",
  "Each cluster's spread vs. distance to its closest neighbour. Lower is better.":
    "Dispersão de cada grupo em relação à distância ao vizinho mais próximo. Menor é melhor.",
  "External check against known labels — only possible when labels happen to exist.":
    "Verificação externa com rótulos conhecidos, possível apenas quando eles existem.",
  "Scatter plot of {0} against {1}: {2}.": "Gráfico de dispersão de {0} versus {1}: {2}.",
  "{0} over {1}: {2}.": "{0} ao longo de {1}: {2}.",
  "{0} by {1}: {2}.": "{0} por {1}: {2}.",
  "{0} against {1}, with the model's predicted decision boundary shaded behind the data.":
    "{0} versus {1}, com a fronteira de decisão prevista pelo modelo ao fundo.",
  category: "categoria",
  of: "de",
  or: "ou",
  to: "para",
  "W is": "W tem dimensões",
  output: "saída",
  Failed: "Reprovados",
  Passed: "Aprovados",
  inertia: "inércia",
  Iteration: "Iteração",
  loss: "perda",
  now: "atual",
  best: "melhor",
  Error: "Erro",
  Score: "Pontuação",
  precision: "precisão",
  recall: "sensibilidade",
  silhouette: "silhueta",
  Applicants: "Solicitantes",
  Rate: "Taxa",
  Query: "Consulta",
  return: "retorno",
  Steps: "Passos",
  passes: "atende",
  fails: "não atende",
  "Outlook?": "Tempo?",
  "Humidity?": "Umidade?",
  "Wind?": "Vento?",
  "Temperature?": "Temperatura?",
  "A model can fail in two opposite ways:": "Um modelo pode falhar de duas formas opostas:",
  "Too simple, and it misses the pattern even in the data it trained on —":
    "Simples demais, ele perde o padrão até nos dados de treino —",
  "Too flexible, and it memorizes that data's noise, then stumbles on anything new —":
    "Flexível demais, ele memoriza o ruído desses dados e falha em qualquer dado novo —",
  "Every metric in this chapter is only meaningful once you know which of the two you're fighting.":
    "As métricas deste capítulo só fazem sentido quando você sabe qual desses dois problemas está enfrentando.",
  "Stratified and group-aware splits, for imbalanced data and fairness:":
    "Divisões estratificadas e por grupo, para dados desbalanceados e equidade:",
  "Data Splits →": "Divisão dos dados →",
  "Five splits, four combinations": "Cinco divisões, quatro combinações",
  "The bullseye from the top of the page, rebuilt from real fits. Each panel trains the same model on 5 different samples of the sine wave — 5 runs, one color each — and draws all 5 curves against the truth (dashed), with each run's error on its own training points and on the shared test set:":
    "O alvo do início da página, reconstruído com ajustes reais. Cada painel treina o mesmo modelo em 5 amostras diferentes da senoide — 5 execuções, uma cor cada — e desenha as 5 curvas contra a verdade (tracejada), com o erro de cada execução nos próprios pontos de treino e no conjunto de teste comum:",
  "bias shows as curves that all miss the truth in the same way;":
    "o viés aparece como curvas que erram a verdade todas do mesmo jeito;",
  "variance shows as curves that disagree with each other;":
    "a variância aparece como curvas que discordam entre si;",
  "overfitting shows as a test error far above the training error, run after run.":
    "o sobreajuste aparece como um erro de teste muito acima do erro de treino, execução após execução.",
  run: "execução",
  "train MSE": "MSE de treino",
  "test MSE": "MSE de teste",
  "High variance": "Alta variância",
  "Low variance": "Baixa variância",
  "The goal is the top-left panel: the five fits agree with each other and with the truth.":
    "O objetivo é o painel superior esquerdo: os cinco ajustes concordam entre si e com a verdade.",
  "degree 3, 30 points": "grau 3, 30 pontos",
  "degree 1, 30 points": "grau 1, 30 pontos",
  "degree 9, 10 points": "grau 9, 10 pontos",
  "degree 1, 3 points": "grau 1, 3 pontos",
  '"Bias" also has an everyday meaning: a model that treats groups of people differently. A model can be accurate overall and still:':
    '"Viés" também tem um sentido cotidiano: um modelo que trata grupos de pessoas de forma diferente. Um modelo pode ser preciso no geral e ainda assim:',
  "approve one group far less often, or": "aprovar um grupo com muito menos frequência, ou",
  "miss far more of one group's qualified members.":
    "deixar de fora muito mais membros qualificados de um grupo.",
  "Fairness metrics make those differences measurable — and show that they can't all be zero at once.":
    "As métricas de equidade tornam essas diferenças mensuráveis — e mostram que não podem ser todas zero ao mesmo tempo.",
  "Accuracy and fairness at a glance": "Acurácia e equidade em resumo",
  "Does the model make comparable decisions for different groups? Accuracy and fairness are separate questions, so a model can get either one right without the other:":
    "O modelo toma decisões comparáveis para grupos diferentes? Acurácia e equidade são perguntas separadas, então um modelo pode acertar uma sem acertar a outra:",
  "— a systematic error that makes a model's decisions depend on who you are, not only on the evidence about you.":
    "— um erro sistemático que faz as decisões do modelo dependerem de quem você é, não só das evidências sobre você.",
  Fairness: "Equidade",
  "— comparable decisions and error rates across groups. Which comparison counts (approval rates, TPR, FPR, precision) is a choice this lesson makes explicit.":
    "— decisões e taxas de erro comparáveis entre grupos. Qual comparação conta (taxas de aprovação, TPR, FPR, precisão) é uma escolha que esta aula torna explícita.",
  "Class imbalance ≠ fairness": "Desbalanceamento de classes ≠ equidade",
  'Imbalanced data asks: "Is one class under-represented?" (e.g. 95% negative, 5% positive).':
    'Dados desbalanceados perguntam: "Uma classe está sub-representada?" (ex.: 95% negativos, 5% positivos).',
  'Fairness asks: "Does the model treat different groups comparably?" (e.g. TPR 90% for group A, 60% for group B).':
    'A equidade pergunta: "O modelo trata grupos diferentes de forma comparável?" (ex.: TPR de 90% no grupo A, 60% no grupo B).',
  "Representation imbalance can contribute to unfairness, but it is not the same thing. Metrics for imbalanced data are in":
    "O desbalanceamento de representação pode contribuir para a falta de equidade, mas não é a mesma coisa. As métricas para dados desbalanceados estão em",
  "Classification metrics →": "Métricas de classificação →",
  "Five splits, four models": "Cinco divisões, quatro modelos",
  "The four cards from the top of the page, measured. Four illustrative credit scores are each tested on 5 fresh samples of applicants (5 splits, threshold 0.5). Each dot is one split:":
    "Os quatro cartões do início da página, medidos. Quatro escores de crédito ilustrativos são testados, cada um, em 5 novas amostras de candidatos (5 divisões, limiar 0,5). Cada ponto é uma divisão:",
  "left to right: overall accuracy;": "da esquerda para a direita: acurácia geral;",
  "bottom to top: the gap between the groups' true-positive rates (unfairness).":
    "de baixo para cima: a diferença entre as taxas de verdadeiros positivos dos grupos (falta de equidade).",
  "TPR gap |A − B|": "Diferença de TPR |A − B|",
  "Each model lands in its own quadrant — but not every split agrees: one split of the fair-but-inaccurate score shows a sizeable gap by chance. A single test split can make a fair model look unfair, or hide an unfair one; score several.":
    "Cada modelo cai no seu quadrante — mas nem toda divisão concorda: uma divisão do escore justo porém impreciso mostra, por acaso, uma diferença considerável. Uma única divisão de teste pode fazer um modelo justo parecer injusto, ou esconder um injusto; avalie várias.",
  "Accuracy and fairness are two axes, not one: report both, per group, across splits.":
    "Acurácia e equidade são dois eixos, não um: reporte ambas, por grupo, em várias divisões.",
  "{0}: TPR {1}, FPR {2}": "{0}: TPR {1}, FPR {2}",
  "Qualified / should be approved (positive)": "Qualificado / deveria ser aprovado (positivo)",
  "Not qualified (negative)": "Não qualificado (negativo)",
  "Model approved": "Aprovado pelo modelo",
  "TPR (true-positive rate)": "TPR (taxa de verdadeiros positivos)",
  "Share of qualified people correctly approved.":
    "Proporção de pessoas qualificadas aprovadas corretamente.",
  "FPR (false-positive rate)": "FPR (taxa de falsos positivos)",
  "Share of non-qualified people incorrectly approved.":
    "Proporção de pessoas não qualificadas aprovadas incorretamente.",
  "Comparable error rates and outcomes across groups (e.g. equal opportunity: equal TPR).":
    "Taxas de erro e resultados comparáveis entre grupos (ex.: igualdade de oportunidade: TPR igual).",
  "Accurate and fair": "Preciso e justo",
  "Good overall performance and similar results across groups.":
    "Bom desempenho geral e resultados semelhantes entre grupos.",
  "Accurate but unfair": "Preciso, mas injusto",
  "Good overall performance, but one group receives fewer positive decisions.":
    "Bom desempenho geral, mas um grupo recebe menos decisões positivas.",
  "Accurate overall, but unfair": "Preciso no geral, mas injusto",
  "Inaccurate but fair": "Impreciso, mas justo",
  "Similar (but poor) results across groups.": "Resultados semelhantes (mas ruins) entre grupos.",
  "Fair, but inaccurate": "Justo, mas impreciso",
  "Fair but inaccurate": "Justo, mas impreciso",
  "Inaccurate and unfair": "Impreciso e injusto",
  "Poor performance and different results across groups.":
    "Desempenho ruim e resultados diferentes entre grupos.",
  'A classifier answers "which category?" — and every answer is either right or wrong. But not all wrong answers cost the same:':
    'Um classificador responde "qual categoria?" — e cada resposta está certa ou errada. Mas nem todo erro custa o mesmo:',
  "missing a fraud (a false negative) is one mistake;":
    "deixar passar uma fraude (um falso negativo) é um tipo de erro;",
  "flagging an honest customer (a false positive) is another.":
    "marcar um cliente honesto (um falso positivo) é outro.",
  "Each metric below counts the mistakes a different way.":
    "Cada métrica abaixo conta os erros de um jeito diferente.",
  "— drag it and watch sections 1–6 change.": "— arraste-o e veja as seções 1–6 mudarem.",
  "Specificity and balanced accuracy": "Especificidade e acurácia balanceada",
  Specificity: "Especificidade",
  "(true-negative rate): of everything really negative, how much was correctly left alone.":
    "(taxa de verdadeiros negativos): de tudo que é realmente negativo, quanto foi corretamente deixado de lado.",
  "Balanced accuracy": "Acurácia balanceada",
  ": the average of recall and specificity.": ": a média entre revocação e especificidade.",
  "Plain accuracy is dominated by whichever class is bigger. Balanced accuracy gives each class an equal vote, so a model that ignores the rare class scores 0.5 — chance — however lopsided the data.":
    "A acurácia simples é dominada pela classe maior. A acurácia balanceada dá o mesmo peso a cada classe, então um modelo que ignora a classe rara marca 0,5 — o acaso — por mais desequilibrados que sejam os dados.",
  specificity: "especificidade",
  "balanced accuracy": "acurácia balanceada",
  "Matthews correlation coefficient (MCC)": "Coeficiente de correlação de Matthews (MCC)",
  "The correlation between predicted and actual labels, from −1 (always wrong) through 0 (no better than chance) to 1 (perfect). It uses all four cells of the confusion matrix.":
    "A correlação entre os rótulos previstos e os reais, de −1 (sempre errado), passando por 0 (não melhor que o acaso), até 1 (perfeito). Usa as quatro células da matriz de confusão.",
  'F1 ignores true negatives and accuracy is swamped by them; MCC is high only when the model does well on both classes. That makes it one of the most reliable single numbers for imbalanced data: the always-"not fraud" model above scores':
    'O F1 ignora os verdadeiros negativos e a acurácia é inundada por eles; o MCC só é alto quando o modelo vai bem nas duas classes. Isso o torna um dos números únicos mais confiáveis para dados desbalanceados: o modelo que sempre diz "não é fraude", acima, marca',
  ", despite its 99% accuracy.": ", apesar dos seus 99% de acurácia.",
  "Brier score and calibration": "Escore de Brier e calibração",
  "Brier score: the mean squared gap between each predicted probability and what happened (1 or 0). A calibration curve groups predictions by confidence and plots how often the positive class actually occurred; expected calibration error (ECE) averages the gap.":
    "Escore de Brier: a diferença quadrática média entre cada probabilidade prevista e o que aconteceu (1 ou 0). Uma curva de calibração agrupa as previsões por confiança e mostra com que frequência a classe positiva realmente ocorreu; o erro de calibração esperado (ECE) faz a média dessa diferença.",
  "Ranking well and being calibrated are different skills. The fraud model below ranks payments almost perfectly (ROC AUC":
    "Ordenar bem e ser calibrado são habilidades diferentes. O modelo de fraude abaixo ordena os pagamentos quase perfeitamente (ROC AUC",
  "), yet its scores are not probabilities: payments it scores around 50% are fraud far less often. Calibrate before you treat a score as a probability — and check calibration per group when fairness matters.":
    "), mas seus escores não são probabilidades: pagamentos com escore perto de 50% são fraude com muito menos frequência. Calibre antes de tratar um escore como probabilidade — e verifique a calibração por grupo quando a equidade importa.",
  "Brier score": "Escore de Brier",
  "fraud model": "modelo de fraude",
  "perfectly calibrated": "perfeitamente calibrado",
  "Predicted probability": "Probabilidade prevista",
  "Observed fraud rate": "Taxa de fraude observada",
  "Balanced vs. imbalanced data — and fairness":
    "Dados balanceados vs. desbalanceados — e equidade",
  "A dataset is imbalanced when one class is rare. In":
    "Um conjunto de dados é desbalanceado quando uma classe é rara. Em",
  "illustrative card payments,": "pagamentos de cartão ilustrativos,",
  "are fraud. Two models:": "são fraude. Dois modelos:",
  'a lazy model that always answers "not fraud";':
    'um modelo preguiçoso que sempre responde "não é fraude";',
  "a real fraud model that scores every payment.":
    "um modelo de fraude de verdade que pontua cada pagamento.",
  'Always "not fraud"': 'Sempre "não é fraude"',
  "Fraud model": "Modelo de fraude",
  "Accuracy barely separates them, and ROC AUC flatters the real model. Balanced accuracy, MCC, F1 and PR AUC tell the honest story: the lazy model is useless, and the real one still misses or mis-flags a lot of the rare class.":
    "A acurácia mal os diferencia, e a ROC AUC lisonjeia o modelo real. Acurácia balanceada, MCC, F1 e PR AUC contam a história honesta: o modelo preguiçoso é inútil, e o real ainda perde ou marca errado boa parte da classe rara.",
  "On imbalanced data, use": "Em dados desbalanceados, use",
  Because: "Porque",
  "Class imbalance": "Desbalanceamento de classes",
  ": one class is rare — e.g. 95% negative, 5% positive.":
    ": uma classe é rara — ex.: 95% negativos, 5% positivos.",
  ": the model behaves differently for different groups of people — e.g. TPR 90% for group A, 60% for group B.":
    ": o modelo se comporta de forma diferente para grupos de pessoas diferentes — ex.: TPR de 90% no grupo A, 60% no grupo B.",
  "They are independent. You can have:": "Os dois são independentes. Você pode ter:",
  "a perfectly balanced dataset that is still unfair;":
    "um conjunto perfeitamente balanceado que ainda é injusto;",
  "an imbalanced dataset that is reasonably fair;":
    "um conjunto desbalanceado que é razoavelmente justo;",
  "class imbalance without demographic imbalance;":
    "desbalanceamento de classes sem desbalanceamento demográfico;",
  "demographic imbalance without class imbalance.":
    "desbalanceamento demográfico sem desbalanceamento de classes.",
  "To evaluate fairness, compute the metrics on this page per group and compare them: TPR (equal opportunity), TPR and FPR (equalized odds), precision (predictive parity), and calibration or log loss per group — a model can be well calibrated overall and badly calibrated for a minority group. See":
    "Para avaliar a equidade, calcule as métricas desta página por grupo e compare-as: TPR (igualdade de oportunidade), TPR e FPR (chances equalizadas), precisão (paridade preditiva) e calibração ou log loss por grupo — um modelo pode ser bem calibrado no geral e mal calibrado para um grupo minoritário. Veja",
  "Bias & Fairness →": "Viés e equidade →",
  "Representation imbalance can contribute to unfairness, but it is not the same thing as unfairness.":
    "O desbalanceamento de representação pode contribuir para a falta de equidade, mas não é a mesma coisa que falta de equidade.",
  "Is it right on both classes?": "Acerta nas duas classes?",
  "Imbalanced classes; an accuracy you can still read.":
    "Classes desbalanceadas; uma acurácia que ainda dá para ler.",
  "One number using all four outcomes?": "Um número usando os quatro resultados?",
  "Imbalanced classes; comparing models fairly.":
    "Classes desbalanceadas; comparar modelos de forma justa.",
  "Brier / calibration": "Brier / calibração",
  "Do its probabilities match reality?": "Suas probabilidades batem com a realidade?",
  "Scores are used as probabilities, or compared across groups.":
    "Os escores são usados como probabilidades ou comparados entre grupos.",
  'students, hours studied vs. passing (Wikipedia, "Logistic regression"). The fraud examples are synthetic, constructed to show the imbalance traps.':
    'estudantes, horas de estudo vs. aprovação (Wikipédia, "Logistic regression"). Os exemplos de fraude são sintéticos, construídos para mostrar as armadilhas do desbalanceamento.',
  "Bal. acc.": "Acur. bal.",
  "Precision, recall, F1, Fβ": "Precisão, revocação, F1, Fβ",
  "They focus on the rare positive class; Fβ lets you weigh recall or precision.":
    "Focam na classe positiva rara; o Fβ permite dar mais peso à revocação ou à precisão.",
  "PR AUC (average precision)": "PR AUC (precisão média)",
  "More informative than ROC AUC when negatives dominate.":
    "Mais informativa que a ROC AUC quando os negativos dominam.",
  "Still useful for ranking, but can look optimistic when negatives dominate.":
    "Ainda útil para ordenação, mas pode parecer otimista quando os negativos dominam.",
  "One summary number built from all four confusion-matrix cells.":
    "Um número-resumo construído com as quatro células da matriz de confusão.",
  "Each class counts equally: the mean of recall and specificity.":
    "Cada classe conta igual: a média entre revocação e especificidade.",
  "Specificity (TNR)": "Especificidade (TNR)",
  "When false positives are costly.": "Quando falsos positivos são caros.",
  "Recall (sensitivity, TPR)": "Revocação (sensibilidade, TPR)",
  "When missing a positive is costly.": "Quando perder um positivo é caro.",
  "Log loss, Brier score": "Log loss, escore de Brier",
  "They judge the probabilities, not just the final yes/no.":
    "Avaliam as probabilidades, não só o sim/não final.",
  "Calibration curve, ECE": "Curva de calibração, ECE",
  "When the predicted probabilities themselves are used.":
    "Quando as próprias probabilidades previstas são usadas.",
  "Time-based split: each round trains on earlier periods and tests on the next.":
    "Divisão temporal: cada rodada treina com períodos anteriores e testa no seguinte.",
  "time →": "tempo →",
  test: "teste",
  "future, unused": "futuro, não usado",
  "Grouped split: all of a customer's payments go to the same side.":
    "Divisão por grupo: todos os pagamentos de um cliente ficam do mesmo lado.",
  Data: "Divisão",
  splits: "dos dados",
  "A model graded on the examples it studied will always look better than it is. So the data is split, and each part has one job:":
    "Um modelo avaliado nos exemplos que estudou sempre parece melhor do que é. Por isso os dados são divididos, e cada parte tem uma função:",
  Training: "Treino",
  "— fits the model's parameters.": "— ajusta os parâmetros do modelo.",
  Validation: "Validação",
  "— chooses between models, features and settings.":
    "— escolhe entre modelos, atributos e configurações.",
  Test: "Teste",
  "— reports the final score, once, on data nothing was tuned on.":
    "— reporta o resultado final, uma única vez, em dados nos quais nada foi ajustado.",
  "How you split decides what your metrics mean — especially for rare classes and small groups.":
    "A forma de dividir decide o que suas métricas significam — principalmente para classes raras e grupos pequenos.",
  "The running example is synthetic:": "O exemplo usado é sintético:",
  "card payments,": "pagamentos de cartão,",
  "of them fraud (heavily imbalanced), with about":
    "deles fraude (fortemente desbalanceado), com cerca de",
  "from a minority customer group B.": "de um grupo minoritário de clientes, B.",
  "Train / validation / test holdout": "Separação treino / validação / teste",
  "Shuffle once and cut the data into three parts, commonly about 60/20/20 (or 80/10/10 with lots of data).":
    "Embaralhe uma vez e corte os dados em três partes, geralmente cerca de 60/20/20 (ou 80/10/10 com muitos dados).",
  "Every decision made while looking at a split leaks a little of it into the model. Keep the test set locked until the very end. Common leaks:":
    "Cada decisão tomada olhando para uma parte vaza um pouco dela para o modelo. Mantenha o conjunto de teste trancado até o final. Vazamentos comuns:",
  "tuning on the test set;": "ajustar usando o conjunto de teste;",
  "scaling or selecting features using all the data before splitting;":
    "normalizar ou selecionar atributos usando todos os dados antes de dividir;",
  "the same person, item or time period on both sides.":
    "a mesma pessoa, item ou período nos dois lados.",
  "k-fold cross-validation": "Validação cruzada k-fold",
  "Cut the training data into k folds. Train k times, each time validating on a different fold, and average the k scores.":
    "Corte os dados de treino em k partes (folds). Treine k vezes, validando a cada vez em uma parte diferente, e faça a média dos k resultados.",
  "Every example gets used for validation once, so the estimate is steadier than a single holdout — essential when data is scarce. The spread across folds also shows how much the score depends on the luck of the split.":
    "Cada exemplo é usado na validação uma vez, então a estimativa é mais estável que uma única separação — essencial quando há poucos dados. A variação entre as partes também mostra quanto o resultado depende da sorte da divisão.",
  "Stratified splits for imbalanced data": "Divisões estratificadas para dados desbalanceados",
  "Deal each class into the folds separately, so every fold keeps the same class proportions as the whole dataset.":
    "Distribua cada classe entre as partes separadamente, para que cada parte mantenha as mesmas proporções de classe do conjunto inteiro.",
  "With a rare class, plain random folds are lumpy. Here one random fold gets no fraud at all — precision, recall and F1 are undefined there, and the average across folds is distorted. Stratified folds get the same number each.":
    "Com uma classe rara, partes aleatórias ficam irregulares. Aqui uma parte aleatória não recebe nenhuma fraude — precisão, revocação e F1 ficam indefinidos nela, e a média entre as partes fica distorcida. Partes estratificadas recebem o mesmo número cada.",
  "frauds per random fold": "fraudes por parte aleatória",
  "frauds per stratified fold": "fraudes por parte estratificada",
  "Random folds": "Partes aleatórias",
  "Stratified folds": "Partes estratificadas",
  Fold: "Parte",
  "Frauds in the fold": "Fraudes na parte",
  "Group-aware splits for fairness": "Divisões por grupo para a equidade",
  "Stratify on class and group together — e.g. fraud × customer group — so every fold holds a proportional share of each group, positives included.":
    "Estratifique por classe e grupo juntos — ex.: fraude × grupo de clientes — para que cada parte tenha uma fatia proporcional de cada grupo, positivos incluídos.",
  "Fairness is measured per group (TPR, FPR, precision by group), so each split needs enough members of every group to compute them. Random folds give group B anywhere from a handful to a crowd; stratified folds keep it steady. But group B has only":
    "A equidade é medida por grupo (TPR, FPR, precisão por grupo), então cada parte precisa de membros suficientes de cada grupo para calculá-las. Partes aleatórias dão ao grupo B de um punhado a uma multidão; partes estratificadas o mantêm estável. Mas o grupo B tem só",
  "frauds in total — no split can put one in every fold. When a group is that small, collect more data or use fewer folds.":
    "fraudes no total — nenhuma divisão consegue pôr uma em cada parte. Quando um grupo é tão pequeno, colete mais dados ou use menos partes.",
  "A good split makes fairness measurable. It cannot make a model fair — only the per-group metrics can tell you whether it is.":
    "Uma boa divisão torna a equidade mensurável. Ela não torna um modelo justo — só as métricas por grupo dizem se ele é.",
  "Stratified by class × group": "Estratificada por classe × grupo",
  "Group B payments in the fold": "Pagamentos do grupo B na parte",
  "Time-based and grouped splits": "Divisões temporais e por grupo",
  "Time-based": "Temporal",
  ": train on the past, test on the period right after (rolling origin).":
    ": treine com o passado, teste no período logo depois (origem móvel).",
  Grouped: "Por grupo",
  ": all rows of one customer, patient or device go to the same side.":
    ": todas as linhas de um cliente, paciente ou dispositivo ficam do mesmo lado.",
  "A shuffled split lets the model peek at the future, or memorize a customer it will be tested on. The score looks great and collapses in production. Split the way the model will be used.":
    "Uma divisão embaralhada deixa o modelo espiar o futuro, ou memorizar um cliente no qual será testado. O resultado parece ótimo e desaba em produção. Divida do jeito que o modelo será usado.",
  Holdout: "Separação simples",
  "One honest final score?": "Um resultado final honesto?",
  "Plenty of data; a quick, simple setup.": "Muitos dados; uma configuração rápida e simples.",
  "k-fold CV": "Validação cruzada k-fold",
  "A steadier estimate, with its spread?": "Uma estimativa mais estável, com sua variação?",
  "Small or medium data; tuning hyperparameters.":
    "Dados pequenos ou médios; ajuste de hiperparâmetros.",
  "Stratified k-fold": "k-fold estratificado",
  "Every fold has the rare class?": "Toda parte tem a classe rara?",
  "Imbalanced classes.": "Classes desbalanceadas.",
  "Every fold can measure each group?": "Toda parte consegue medir cada grupo?",
  "Fairness evaluation; small groups.": "Avaliação de equidade; grupos pequenos.",
  "Does it predict the future?": "Ele prevê o futuro?",
  "Forecasting; any data that drifts over time.": "Previsão; qualquer dado que muda com o tempo.",
  "Does it work on new people or items?": "Funciona com pessoas ou itens novos?",
  "Several rows per customer, patient or device.":
    "Várias linhas por cliente, paciente ou dispositivo.",
  "Fits the model's parameters.": "Ajusta os parâmetros do modelo.",
  "Chooses between models and settings.": "Escolhe entre modelos e configurações.",
  "Reports the final score, once.": "Reporta o resultado final, uma única vez.",
  "Clustering has no answer key: nobody told the algorithm which groups exist. So its metrics come in two kinds:":
    "O agrupamento não tem gabarito: ninguém disse ao algoritmo quais grupos existem. Por isso suas métricas são de dois tipos:",
  Internal: "Internas",
  "— they judge the shape of the groups themselves: tight inside, far apart from each other.":
    "— julgam o formato dos próprios grupos: compactos por dentro, distantes entre si.",
  External: "Externas",
  "— when true labels happen to exist, they check the groups against them.":
    "— quando rótulos verdadeiros existem, comparam os grupos com eles.",
  "Most real clustering problems have only the internal kind to go on.":
    "A maioria dos problemas reais de agrupamento só conta com as do tipo interno.",
  "A regression model predicts a number, so it is never simply right or wrong — it is off by some amount. Regression metrics differ in how they add those amounts up:":
    "Um modelo de regressão prevê um número, então nunca está simplesmente certo ou errado — ele erra por alguma quantidade. As métricas de regressão diferem em como somam essas quantidades:",
  "in the target's own units, or as a percentage;":
    "na própria unidade do alvo, ou em porcentagem;",
  "and how harshly they punish a big miss.": "e no quanto punem um erro grande.",
  "Pick the metric whose idea of a bad miss matches yours.":
    "Escolha a métrica cuja ideia de erro grave combina com a sua.",
  "In reinforcement learning there is no answer key at all. An agent acts, the world hands back a reward, and the agent must learn which actions pay off — while it is still being scored. So RL metrics track reward over time:":
    "No aprendizado por reforço não há gabarito nenhum. Um agente age, o mundo devolve uma recompensa, e o agente precisa aprender quais ações compensam — enquanto ainda está sendo avaliado. Por isso as métricas de RL acompanham a recompensa ao longo do tempo:",
  "how much was earned;": "quanto foi ganho;",
  "how much was lost while learning;": "quanto foi perdido enquanto aprendia;",
  "how quickly and reliably the agent got good.":
    "quão rápido e de forma confiável o agente ficou bom.",
  "In RL, how an agent learns is measured as carefully as where it ends up.":
    "Em RL, como o agente aprende é medido com o mesmo cuidado que onde ele chega.",
  Metrics: "Métricas",
  "Group A": "Grupo A",
  "Group B": "Grupo B",
  "With our numbers": "Com os nossos números",
  "lazy fraud model:": "modelo de fraude preguiçoso:",
  "winning pass–fail pairs": "pares aprovado–reprovado vencidos",
  "{0} h, failed:": "{0} h, reprovado:",
  "{0} h, passed:": "{0} h, aprovado:",
  "sum of all": "soma de todos os",
  "a fraud scored {0}:": "uma fraude com escore {0}:",
  "a legit payment scored {0}:": "um pagamento legítimo com escore {0}:",
  "bin around {0}:": "faixa em torno de {0}:",
  "were fraud": "eram fraude",
  "(gap": "(diferença",
  "lazy:": "preguiçoso:",
  "(no positive predictions: defined as 0)": "(nenhuma previsão positiva: definido como 0)",
  "model:": "modelo:",
  "{0} m² house:": "casa de {0} m²:",
  "with the outlier:": "com o ponto atípico:",
  "flower {0}, the least settled:": "flor {0}, a menos acomodada:",
  "(one sum per cluster, k = {0})": "(uma soma por grupo, k = {0})",
  "score = mean of all {0} =": "escore = média das {0} =",
  runs: "execuções",
  "ε = 0.1, last {0} steps:": "ε = 0,1, últimos {0} passos:",
  "ε = 0.1:": "ε = 0,1:",
  "ε = 0.1, step {0}:": "ε = 0,1, passo {0}:",
  "shortest path:": "caminho mais curto:",
  "last {0} episodes, mean return:": "últimos {0} episódios, retorno médio:",
  "last {0} episodes:": "últimos {0} episódios:",
  "vs. shortest": "vs. mínimo de",
  "episodes reached G": "episódios chegaram a G",
  learned: "aprendido",
  ideal: "ideal",
  gap: "diferença",
  "degree {0}:": "grau {0}:",
  training: "treino",
  "fair share": "fatia justa",
  frauds: "fraudes",
  folds: "partes",
  "per fold": "por parte",
  "group B": "grupo B",
  "its frauds": "suas fraudes",
  "The degree is the highest power of x in the curve's formula — roughly, how many times the curve can bend:":
    "O grau é a maior potência de x na fórmula da curva — em resumo, quantas vezes a curva pode se curvar:",
  "Degree 0": "Grau 0",
  "— a flat line: ŷ = w₀. It can't follow anything.":
    "— uma linha reta horizontal: ŷ = w₀. Não consegue acompanhar nada.",
  "Degree 1": "Grau 1",
  "— a straight, sloped line: ŷ = w₀ + w₁x. No bends.":
    "— uma reta inclinada: ŷ = w₀ + w₁x. Nenhuma curva.",
  "Degree 2": "Grau 2",
  "— a parabola: adds w₂x², one bend.": "— uma parábola: acrescenta w₂x², uma curva.",
  "Degree 3": "Grau 3",
  "— a cubic: adds w₃x³, two bends — enough for one sine wave.":
    "— uma cúbica: acrescenta w₃x³, duas curvas — o suficiente para uma onda senoidal.",
  "Degree 9": "Grau 9",
  "— up to eight bends and 10 coefficients: enough to pass exactly through 10 points, noise included.":
    "— até oito curvas e 10 coeficientes: o suficiente para passar exatamente por 10 pontos, ruído incluído.",
  "Each extra degree adds one more coefficient to learn: more flexibility to follow the pattern — and to follow the noise.":
    "Cada grau a mais acrescenta um coeficiente a aprender: mais flexibilidade para seguir o padrão — e para seguir o ruído.",
  "coefficient to learn": "coeficiente a aprender",
  "coefficients to learn": "coeficientes a aprender",
  "A cubic can bend twice — enough for one sine wave — and 30 points pin it down. All five runs land on the truth and on each other: low bias, low variance.":
    "Uma cúbica pode se curvar duas vezes — o suficiente para uma onda senoidal — e 30 pontos a fixam. As cinco execuções caem sobre a verdade e umas sobre as outras: baixo viés, baixa variância.",
  "A straight line can't bend, so every run misses the wave in the same way: high bias. With 30 points each, the five lines barely differ: low variance.":
    "Uma reta não se curva, então toda execução erra a onda do mesmo jeito: alto viés. Com 30 pontos cada, as cinco retas quase não diferem: baixa variância.",
  "Ten coefficients for ten points: every run threads its own noisy points exactly (training MSE 0) and swings wildly between them. On average they follow the wave (low bias), but they disagree with each other (high variance).":
    "Dez coeficientes para dez pontos: cada execução passa exatamente pelos seus pontos ruidosos (MSE de treino 0) e oscila muito entre eles. Na média elas seguem a onda (baixo viés), mas discordam entre si (alta variância).",
  "A line can't bend (high bias), and three random points let one unlucky sample tilt it completely (high variance). Both problems at once — the worst case.":
    "Uma reta não se curva (alto viés), e três pontos aleatórios deixam uma amostra azarada incliná-la por completo (alta variância). Os dois problemas ao mesmo tempo — o pior caso.",
  "Try it:": "Experimente:",
  Generalization: "Capacidade de",
  ability: "generalização",
  '"The ability to perform well on previously unobserved inputs is called generalization" (Goodfellow, Bengio & Courville, 2016). It is the whole point of learning from data — and it fails in three ways:':
    '"A capacidade de ter bom desempenho em entradas nunca vistas é chamada de generalização" (Goodfellow, Bengio e Courville, 2016). É o objetivo de aprender com dados — e ela falha de três formas:',
  "Too simple": "Simples demais",
  "— the model underfits: it misses the pattern even in its training data (bias).":
    "— o modelo subajusta: perde o padrão até nos dados de treino (viés).",
  "Too flexible": "Flexível demais",
  "— the model memorizes: it reproduces its training data, noise included, and stumbles on anything new (variance).":
    "— o modelo memoriza: reproduz os dados de treino, ruído incluído, e tropeça em qualquer coisa nova (variância).",
  "Too few of some group": "Poucos dados de algum grupo",
  "— the model generalizes unevenly: fine on average, failing the people it rarely saw (fairness).":
    "— o modelo generaliza de forma desigual: bem na média, falhando com as pessoas que quase não viu (equidade).",
  "Training performance is a promise; generalization is whether it is kept.":
    "O desempenho no treino é uma promessa; a generalização é se ela é cumprida.",
  "The generalization gap": "A lacuna de generalização",
  "The difference between how well a model does on the data it trained on and on new data from the same source.":
    "A diferença entre o desempenho do modelo nos dados com que treinou e em dados novos da mesma origem.",
  "Training scores always flatter the model. The gap is the honest correction: small means the model learned the pattern, large means it learned the examples. Measuring it needs data the model never saw — see":
    "Os resultados de treino sempre lisonjeiam o modelo. A lacuna é a correção honesta: pequena significa que o modelo aprendeu o padrão; grande, que aprendeu os exemplos. Medi-la exige dados que o modelo nunca viu — veja",
  Underfit: "Subajuste",
  "Good fit": "Bom ajuste",
  Imbalanced: "Desbalanceado",
  "group B (minority)": "grupo B (minoria)",
  "Finding the equilibrium": "Encontrando o equilíbrio",
  "Good generalization is a balance: enough capacity to learn the rule, not so much that it learns the examples — and enough data from everyone it will serve.":
    "Uma boa generalização é um equilíbrio: capacidade suficiente para aprender a regra, não tanta que aprenda os exemplos — e dados suficientes de todos que o modelo vai atender.",
  "Sources: Goodfellow, Bengio & Courville (2016), Deep Learning, §5.2; Zhang et al. (2017), Understanding deep learning requires rethinking generalization; Sagawa et al. (2020), Distributionally robust neural networks (worst-group accuracy). The data here is synthetic.":
    "Fontes: Goodfellow, Bengio e Courville (2016), Deep Learning, §5.2; Zhang et al. (2017), Understanding deep learning requires rethinking generalization; Sagawa et al. (2020), Distributionally robust neural networks (acurácia do pior grupo). Os dados aqui são sintéticos.",
  "Training and test scores both poor": "Resultados de treino e de teste ambos ruins",
  "Underfitting (bias)": "Subajuste (viés)",
  "More capacity, better features, less regularization":
    "Mais capacidade, atributos melhores, menos regularização",
  "Training far better than test (a big gap)":
    "Treino muito melhor que o teste (uma lacuna grande)",
  "Memorizing (variance)": "Memorização (variância)",
  "One group far behind the others": "Um grupo muito atrás dos outros",
  "Uneven generalization (imbalance → unfairness)":
    "Generalização desigual (desbalanceamento → falta de equidade)",
  "More data for that group, reweighting or oversampling, group-stratified splits, report worst-group accuracy":
    "Mais dados desse grupo, repesagem ou sobreamostragem, divisões estratificadas por grupo, reportar a acurácia do pior grupo",
  accuracy: "acurácia",
  "worst group": "pior grupo",
  "training accuracy": "acurácia de treino",
  "test accuracy": "acurácia de teste",
  "epoch {0} / {1}": "época {0} / {1}",
  fit: "ajuste",
  "training MSE": "MSE de treino",
  Model: "Modelo",
  "Underfitting — it can't even fit its own training data. It needs more capacity.":
    "Subajuste — não consegue nem ajustar os próprios dados de treino. Precisa de mais capacidade.",
  "Good fit — training and test scores are close, and both groups are served.":
    "Bom ajuste — os resultados de treino e de teste estão próximos, e os dois grupos são atendidos.",
  "One group left behind — fine for the majority, failing the group it rarely saw.":
    "Um grupo deixado para trás — bom para a maioria, falhando com o grupo que quase não viu.",
  "class 0": "classe 0",
  "class 1": "classe 1",
  "Neural network": "Rede neural",
  "Training size": "Tamanho do treino",
  "Random labels": "Rótulos aleatórios",
  "Minority share": "Fatia da minoria",
  "Hidden neurons": "Neurônios ocultos",
  "Why generalization ability is important": "Por que a capacidade de generalização importa",
  "A model is only useful on data it has not seen yet: the next patient, the next payment, the next applicant. Every earlier lesson in this group is one way that can go wrong, and one way to catch it:":
    "Um modelo só é útil em dados que ainda não viu: o próximo paciente, o próximo pagamento, o próximo candidato. Cada aula anterior deste grupo é uma forma de isso dar errado, e uma forma de perceber:",
  Concept: "Conceito",
  "What goes wrong": "O que dá errado",
  "How you see it": "Como perceber",
  Lesson: "Aula",
  "They are connected:": "Eles estão ligados:",
  "bias and variance pull in opposite directions — more capacity lowers one and raises the other;":
    "viés e variância puxam em direções opostas — mais capacidade diminui um e aumenta o outro;",
  "imbalanced data is a variance problem for the rare group: too few examples to learn it reliably;":
    "dados desbalanceados são um problema de variância para o grupo raro: exemplos de menos para aprendê-lo com confiança;",
  "and when the rare group is a group of people, that uneven generalization is exactly what fairness metrics measure.":
    "e quando o grupo raro é um grupo de pessoas, essa generalização desigual é exatamente o que as métricas de equidade medem.",
  "Generalization is what all of these protect: performance that holds on new data — for everyone the model will serve.":
    "A generalização é o que tudo isso protege: um desempenho que se mantém em dados novos — para todos que o modelo vai atender.",
  "Good fit, split 1:": "Bom ajuste, divisão 1:",
  "The scenarios below use one synthetic, two-group dataset. Group A (the majority, left) follows a wavy boundary; group B (the minority, right) follows the opposite rule. The test set is fixed, clean and balanced: 200 points per group.":
    "Os cenários abaixo usam um conjunto sintético de dois grupos. O grupo A (a maioria, à esquerda) segue uma fronteira ondulada; o grupo B (a minoria, à direita) segue a regra oposta. O conjunto de teste é fixo, limpo e balanceado: 200 pontos por grupo.",
  Scenarios: "Cenários",
  "Each tab sets up a neural network to land in one situation, then trains it on 5 different training splits — like the five runs in Bias & Variance. The settings are yours to change. How to read the chart:":
    "Cada aba configura uma rede neural para cair em uma situação e a treina em 5 divisões de treino diferentes — como as cinco execuções de Viés e variância. Você pode mudar as configurações. Como ler o gráfico:",
  "shading — what the five networks predict on average;":
    "sombreado — o que as cinco redes preveem em média;",
  "colored lines — each run's decision boundary;":
    "linhas coloridas — a fronteira de decisão de cada execução;",
  "dashed line — the true boundary;": "linha tracejada — a fronteira verdadeira;",
  "lines that disagree mean variance; lines that agree but miss the truth mean bias; lines that ignore the right-hand region mean group B is left behind.":
    "linhas que discordam indicam variância; linhas que concordam mas erram a verdade indicam viés; linhas que ignoram a região da direita indicam que o grupo B foi deixado para trás.",
  "The model is too simple: it underfits.": "O modelo é simples demais: subajusta.",
  "Training and test error both high; the runs agree, all wrong together.":
    "Erros de treino e de teste ambos altos; as execuções concordam, todas erradas juntas.",
  "Bias & Variance →": "Viés e variância →",
  "The model is too flexible: it memorizes its sample, noise included.":
    "O modelo é flexível demais: memoriza sua amostra, ruído incluído.",
  "A big train–test gap; runs trained on different splits disagree.":
    "Uma grande lacuna entre treino e teste; execuções treinadas em divisões diferentes discordam.",
  "Imbalanced data": "Dados desbalanceados",
  "A class or a group is barely represented in the training data.":
    "Uma classe ou um grupo quase não aparece nos dados de treino.",
  "One group's score far below the rest; folds with no examples of it.":
    "O resultado de um grupo muito abaixo dos demais; partes sem nenhum exemplo dele.",
  "Errors are spread unevenly across groups of people.":
    "Os erros se distribuem de forma desigual entre grupos de pessoas.",
  "Per-group TPR, FPR and precision; worst-group accuracy.":
    "TPR, FPR e precisão por grupo; acurácia do pior grupo.",
  "More data, a simpler model (fewer neurons) or more regularization, early stopping, cross-validation":
    "Mais dados, um modelo mais simples (menos neurônios) ou mais regularização, parada antecipada, validação cruzada",
  "Neural network, one hidden layer": "Rede neural, uma camada oculta",
  "Train 5 splits": "Treinar 5 divisões",
  "Reset to scenario": "Voltar ao cenário",
  mean: "média",
  "mean gap": "lacuna média",
  "test spread": "variação do teste",
  "Training… the verdict appears when all runs finish.":
    "Treinando… o diagnóstico aparece quando todas as execuções terminam.",
  "Underfit (high bias)": "Subajuste (alto viés)",
  "One hidden neuron can only draw a single smooth line through the plane — far too simple for group A's wavy boundary. All five runs make the same mistake: low training and test accuracy, and boundaries that agree with each other. That is bias.":
    "Um neurônio oculto só consegue desenhar uma única linha suave no plano — simples demais para a fronteira ondulada do grupo A. As cinco execuções cometem o mesmo erro: acurácia de treino e de teste baixas, e fronteiras que concordam entre si. Isso é viés.",
  "Eight neurons, 200 clean examples per split, both groups equally represented. The five boundaries agree with each other and follow the truth: training and test accuracy are high and close, for both groups.":
    "Oito neurônios, 200 exemplos limpos por divisão, os dois grupos igualmente representados. As cinco fronteiras concordam entre si e seguem a verdade: acurácia de treino e de teste altas e próximas, para os dois grupos.",
  "Overfit (high variance)": "Sobreajuste (alta variância)",
  "32 neurons, only 40 examples per split, and 60% of the labels replaced at random. Each network bends its boundary around its own noisy points: high training accuracy, much lower test accuracy, and five runs that disagree. Zhang et al. (2017) showed large networks will even memorize completely random labels — training accuracy alone proves nothing.":
    "32 neurônios, só 40 exemplos por divisão e 60% dos rótulos trocados ao acaso. Cada rede curva sua fronteira em volta dos próprios pontos ruidosos: acurácia de treino alta, de teste bem menor, e cinco execuções que discordam. Zhang et al. (2017) mostraram que redes grandes memorizam até rótulos totalmente aleatórios — a acurácia de treino sozinha não prova nada.",
  "Imbalanced (unfair)": "Desbalanceado (injusto)",
  "A good model, but group B is only 3% of each training split. Every run learns group A's rule and applies it to group B as well, so B's accuracy collapses while A's stays high. The model generalizes — but not for everyone.":
    "Um bom modelo, mas o grupo B é só 3% de cada divisão de treino. Toda execução aprende a regra do grupo A e a aplica também ao grupo B, então a acurácia de B despenca enquanto a de A continua alta. O modelo generaliza — mas não para todos.",
  "Overfitting — far better on the data it saw than on new data, and the runs disagree.":
    "Sobreajuste — muito melhor nos dados que viu do que em dados novos, e as execuções discordam.",
  "Training…": "Treinando…",
  "Underfitting — only {0} even on its own training data.":
    "Subajuste — só {0} mesmo nos próprios dados de treino.",
  "One group left behind — group A {0}, group B {1}.":
    "Um grupo deixado para trás — grupo A {0}, grupo B {1}.",
  "Overfitting — training {0} vs test {1}: a {2}-point gap.":
    "Sobreajuste — treino {0} vs teste {1}: uma lacuna de {2} pontos.",
  "Good fit — a {0}-point gap, both groups at {1} or above.":
    "Bom ajuste — lacuna de {0} pontos, os dois grupos em {1} ou mais.",
  "Run #{0}": "Execução #{0}",
  "How the data was split into 5:": "Como os dados foram divididos em 5:",
  "5 training samples of {0} points each, drawn from the same population — they differ only by chance;":
    "5 amostras de treino de {0} pontos cada, tiradas da mesma população — diferem só pelo acaso;",
  "1 test set of 400 points (200 per group), held out and never trained on;":
    "1 conjunto de teste de 400 pontos (200 por grupo), separado e nunca usado no treino;",
  "each run trains on its own sample and is scored on that same test set.":
    "cada execução treina com sua própria amostra e é avaliada nesse mesmo conjunto de teste.",
  "Comparing the 5 runs shows how much the result depends on which data you happened to get.":
    "Comparar as 5 execuções mostra o quanto o resultado depende dos dados que calharam de vir.",
  "All 5 runs": "As 5 execuções juntas",
  "Bias / underfitting: mean training accuracy {0} — high bias: the model can't fit even the data it saw.":
    "Viés / subajuste: acurácia média de treino {0} — alto viés: o modelo não ajusta nem os dados que viu.",
  "Bias / underfitting: mean training accuracy {0} — low bias: the model fits the data it saw.":
    "Viés / subajuste: acurácia média de treino {0} — baixo viés: o modelo ajusta os dados que viu.",
  "Variance / overfitting: mean gap {0}, test spread {1} across runs — high variance: each run learned its own sample.":
    "Variância / sobreajuste: lacuna média {0}, variação do teste {1} entre execuções — alta variância: cada execução aprendeu a própria amostra.",
  "Variance / overfitting: mean gap {0}, test spread {1} across runs — low variance: the runs agree and hold up on new data.":
    "Variância / sobreajuste: lacuna média {0}, variação do teste {1} entre execuções — baixa variância: as execuções concordam e se mantêm em dados novos.",
  "Fairness: group A {0}, group B {1} — group {2} is left behind (worst group {3}).":
    "Equidade: grupo A {0}, grupo B {1} — o grupo {2} foi deixado para trás (pior grupo {3}).",
  "Fairness: group A {0}, group B {1} — both groups are served.":
    "Equidade: grupo A {0}, grupo B {1} — os dois grupos são atendidos.",
  View: "Visualização",
  "Algorithm / Performance": "Algoritmo / Desempenho",
  "Training data": "Dados de treino",
  "What to notice": "O que observar",
  "A | B": "A | B",
  "Split 1's training data: group A left of the dashed line, group B right.":
    "Dados de treino da divisão 1: grupo A à esquerda da linha tracejada, grupo B à direita.",
  "training (mean of 5 splits)": "treino (média das 5 divisões)",
  "test set": "conjunto de teste",
  "group · class": "grupo · classe",
  "Share of the set": "Proporção do conjunto",
  "Class distribution per group: training splits vs the test set.":
    "Distribuição das classes por grupo: divisões de treino vs conjunto de teste.",
  split: "divisão",
  points: "pontos",
  "group A": "grupo A",
  "wrong labels": "rótulos errados",
  "Nothing is wrong with the data: 200 clean points per split, half from each group, both classes well represented. If this scenario fails, the model is to blame.":
    "Não há nada de errado com os dados: 200 pontos limpos por divisão, metade de cada grupo, as duas classes bem representadas. Se este cenário falhar, a culpa é do modelo.",
  "Underfitting (high bias): one neuron can only draw one smooth curve, but group A's boundary waves. Training and test accuracy are both low and close together — the model isn't memorizing anything, it simply can't represent the rule. More data won't help; more neurons will.":
    "Subajuste (alto viés): um neurônio só consegue desenhar uma curva suave, mas a fronteira do grupo A ondula. A acurácia de treino e a de teste são baixas e próximas — o modelo não está memorizando nada, só não consegue representar a regra. Mais dados não ajudam; mais neurônios, sim.",
  "Clean, plentiful and balanced: 200 points per split, both groups equally represented, no random labels. Everything a model needs to learn the true rule.":
    "Limpos, abundantes e balanceados: 200 pontos por divisão, os dois grupos igualmente representados, sem rótulos aleatórios. Tudo de que um modelo precisa para aprender a regra verdadeira.",
  "Good fit: enough capacity for the wavy rule, enough data to pin it down. A small gap, five runs that agree, and both groups above 90% — this is what generalization looks like.":
    "Bom ajuste: capacidade suficiente para a regra ondulada, dados suficientes para fixá-la. Uma lacuna pequena, cinco execuções que concordam e os dois grupos acima de 90% — é assim que a generalização se parece.",
  "Only 40 points per split, and 60% of the labels replaced by coin flips — so about 30% of the training labels are simply wrong, and each split's wrong labels land in different places.":
    "Só 40 pontos por divisão, e 60% dos rótulos trocados por cara ou coroa — então cerca de 30% dos rótulos de treino estão simplesmente errados, e os rótulos errados de cada divisão caem em lugares diferentes.",
  "Overfitting (high variance): 32 neurons can bend around every point, wrong labels included. Training accuracy keeps climbing while test accuracy stalls, and each run follows its own noise — so the five boundaries disagree. The cure is more and cleaner data, fewer neurons or regularization, not more training.":
    "Sobreajuste (alta variância): 32 neurônios conseguem se curvar em volta de cada ponto, rótulos errados incluídos. A acurácia de treino continua subindo enquanto a de teste estaciona, e cada execução segue o próprio ruído — por isso as cinco fronteiras discordam. A cura é mais dados e mais limpos, menos neurônios ou regularização, não mais treino.",
  "Group B is only 3% of each split — about 6 points out of 200. Overall the data looks fine; almost all of it is group A, so the model will barely see group B's rule.":
    "O grupo B é só 3% de cada divisão — cerca de 6 pontos em 200. No geral os dados parecem bons; quase tudo é do grupo A, então o modelo mal verá a regra do grupo B.",
  "Unfairness: the model learns group A's rule well and almost never sees group B, so it applies A's rule there too. Group B's accuracy collapses while overall accuracy still looks acceptable. Collect more of group B, reweight it, use group-stratified splits — and always report per-group or worst-group accuracy.":
    "Falta de equidade: o modelo aprende bem a regra do grupo A e quase nunca vê o grupo B, então aplica a regra de A também ali. A acurácia do grupo B despenca enquanto a geral ainda parece aceitável. Colete mais dados do grupo B, dê mais peso a ele, use divisões estratificadas por grupo — e sempre reporte a acurácia por grupo ou do pior grupo.",
  Dataset: "Conjunto de dados",
  "Variance / overfitting: mean gap {0}, test spread {1} — but the gap comes from group B, not memorization: group A scores {2} on new data, as in training.":
    "Variância / sobreajuste: lacuna média {0}, variação do teste {1} — mas a lacuna vem do grupo B, não de memorização: o grupo A marca {2} em dados novos, como no treino.",
  "test (all)": "teste (todos)",
  "test, group A": "teste, grupo A",
  "test, group B": "teste, grupo B",
  "Per group and fairness": "Por grupo e equidade",
  "The same five networks, scored separately for each group on the test set (mean of the runs), and checked against the fairness criteria from":
    "As mesmas cinco redes, avaliadas separadamente para cada grupo no conjunto de teste (média das execuções) e verificadas pelos critérios de equidade de",
  "Test set, mean of 5 runs": "Conjunto de teste, média de 5 execuções",
  Criterion: "Critério",
  Compares: "Compara",
  Gap: "Diferença",
  "selection rate (share labelled 1)": "taxa de seleção (proporção rotulada 1)",
  "lower ÷ higher selection rate, ≥ 0.8 to pass":
    "menor ÷ maior taxa de seleção, ≥ 0,8 para passar",
  "TPR and FPR (larger gap)": "TPR e FPR (a maior diferença)",
  "equal opportunity": "igualdade de oportunidade",
  "equalized odds": "chances equalizadas",
  "Fair by equalized odds: both groups get similar error rates (gap {0} ≤ {1}).":
    "Justo pelas chances equalizadas: os dois grupos têm taxas de erro parecidas (diferença {0} ≤ {1}).",
  "Unfair by equalized odds: the groups get very different error rates (gap {0} > {1}).":
    "Injusto pelas chances equalizadas: os grupos têm taxas de erro muito diferentes (diferença {0} > {1}).",
  "✓ means a gap of at most 0.15 (or a ratio of at least 0.8). The groups' class-1 rates differ slightly in the test set, so not every criterion can be exactly met at once — see the impossibility result in Bias & Fairness.":
    "✓ significa uma diferença de no máximo 0,15 (ou uma razão de pelo menos 0,8). As taxas de classe 1 dos grupos diferem um pouco no conjunto de teste, então nem todo critério pode ser cumprido exatamente ao mesmo tempo — veja o resultado de impossibilidade em Viés e equidade.",
  TPR: "TPR",
  FPR: "FPR",
  "Selection rate": "Taxa de seleção",
  "Not fair either. The single curve fits group A's side best; on group B it calls far more points class 1 than it should, so B's false-positive rate is several times A's. A model too simple for everyone tends to fail some groups more than others.":
    "Também não é justo. A única curva se ajusta melhor ao lado do grupo A; no grupo B ela chama muito mais pontos de classe 1 do que deveria, então a taxa de falsos positivos de B é várias vezes a de A. Um modelo simples demais para todos tende a falhar mais com alguns grupos.",
  "Accurate and fair: both groups get similar true- and false-positive rates, and every criterion passes. Enough data from both groups is what makes this possible.":
    "Preciso e justo: os dois grupos têm taxas de verdadeiros e falsos positivos parecidas, e todos os critérios passam. Dados suficientes dos dois grupos é o que torna isso possível.",
  "Fair, but inaccurate. The random labels hurt both groups about equally, so the error rates match — yet both are poor. Passing a fairness check does not make a model good; read it next to accuracy.":
    "Justo, mas impreciso. Os rótulos aleatórios prejudicam os dois grupos mais ou menos igual, então as taxas de erro coincidem — mas ambas são ruins. Passar num teste de equidade não torna um modelo bom; leia-o junto com a acurácia.",
  "Accurate for group A, unfair to group B: equal opportunity, equalized odds and predictive parity all fail, and disparate impact drops below 0.8. The overall accuracy hides it; the per-group view shows it.":
    "Preciso para o grupo A, injusto com o grupo B: igualdade de oportunidade, chances equalizadas e paridade preditiva falham, e o impacto desproporcional cai abaixo de 0,8. A acurácia geral esconde isso; a visão por grupo mostra.",
  "Not linearly separable": "Não linearmente separável",
  "Epoch limit reached.": "Limite de épocas atingido.",
  "All training points are correctly classified. This line separates this dataset.":
    "Todos os pontos de treino estão classificados corretamente. Esta reta separa este conjunto de dados.",
  "All training points are correctly classified. Probabilities and loss can still change.":
    "Todos os pontos de treino estão classificados corretamente. As probabilidades e a perda ainda podem mudar.",
  "Press Play or Step 1 epoch to watch the line move.":
    "Pressione Executar ou Avançar 1 época para ver a reta se mover.",
  "Opposite corners have the same label. Every straight boundary leaves at least one mistake.":
    "Cantos opostos têm o mesmo rótulo. Toda fronteira reta deixa pelo menos um erro.",
  "These two curves interlock. A straight boundary cannot separate this fixture.":
    "Estas duas curvas se entrelaçam. Uma fronteira reta não consegue separar este conjunto.",
  "A separating line exists. The current weights have not found one yet.":
    "Existe uma reta separadora. Os pesos atuais ainda não a encontraram.",
  "Training: {0}.": "Treinando: {0}.",
  "Finished: all points classified correctly. {0}.":
    "Concluído: todos os pontos classificados corretamente. {0}.",
  "Finished: epoch limit reached. {0}.": "Concluído: limite de épocas atingido. {0}.",
  "Paused: {0}.": "Pausado: {0}.",
  Misclassified: "Classificados errado",
  "Training accuracy": "Acurácia no treino",
  "Binary cross-entropy": "Entropia cruzada binária",
  "Perceptron:": "Perceptron:",
  "one neuron, one line": "um neurônio, uma reta",
  "The problem: separate the blue class from the orange class.":
    "O problema: separar a classe azul da classe laranja.",
  "One neuron combines two inputs and a bias, then makes a prediction. Train it and watch its decision boundary move.":
    "Um neurônio combina duas entradas e um viés e então faz uma previsão. Treine-o e veja sua fronteira de decisão se mover.",
  "Start with OR. Then try XOR: can one straight line separate all four points?":
    "Comece com OR. Depois tente XOR: uma única reta consegue separar os quatro pontos?",
  Configuration: "Configuração",
  "Changing dataset or activation restarts training.":
    "Mudar o conjunto de dados ou a ativação reinicia o treino.",
  "The activation also selects its learning rule (η = {0}).":
    "A ativação também escolhe sua regra de aprendizado (η = {0}).",
  "The model": "O modelo",
  "Decision plot": "Gráfico de decisão",
  "Inspect point": "Inspecionar ponto",
  "class {0}": "classe {0}",
  target: "alvo",
  prediction: "previsão",
  Network: "Rede",
  "Show weights": "Mostrar pesos",
  "Step 1 epoch": "Avançar 1 época",
  "Limit: {0} epochs": "Limite: {0} épocas",
  Performance: "Desempenho",
  "Evaluated on the same points used for training; this does not measure performance on unseen data.":
    "Avaliado nos mesmos pontos usados no treino; isto não mede o desempenho em dados inéditos.",
  "misclassified points": "pontos classificados errado",
  "binary cross-entropy": "entropia cruzada binária",
  "The math": "A matemática",
  "Show math": "Mostrar matemática",
  "Key concepts": "Conceitos-chave",
  Inputs: "Entradas",
  "x₁ and x₂ are the point's two coordinates. The constant 1 is not a feature; it carries the bias.":
    "x₁ e x₂ são as duas coordenadas do ponto. A constante 1 não é uma característica; ela carrega o viés.",
  Weights: "Pesos",
  "w₁ = {0}, w₂ = {1}. They set the boundary's orientation and how strongly each input moves the score.":
    "w₁ = {0}, w₂ = {1}. Eles definem a orientação da fronteira e o quanto cada entrada move a pontuação.",
  "b = {0}. It shifts the boundary without rotating it.":
    "b = {0}. Ele desloca a fronteira sem girá-la.",
  "Weighted sum": "Soma ponderada",
  "z = w₁x₁ + w₂x₂ + b. Class 1 is predicted when z ≥ 0.":
    "z = w₁x₁ + w₂x₂ + b. A classe 1 é prevista quando z ≥ 0.",
  "Step turns z into a hard 0 or 1.": "O degrau transforma z em um 0 ou 1 rígido.",
  "Sigmoid turns z into a probability p; p = 0.5 exactly on the line.":
    "A sigmoide transforma z em uma probabilidade p; p = 0,5 exatamente sobre a reta.",
  "η = {0}: how far each update moves the weights.":
    "η = {0}: o quanto cada atualização move os pesos.",
  "One pass over all {0} points in a shuffled order. This run is at epoch {1}.":
    "Uma passagem por todos os {0} pontos em ordem embaralhada. Este treino está na época {1}.",
  "Linear separability": "Separabilidade linear",
  "A straight line can put every class-1 point on one side and every class-0 point on the other. This dataset is linearly separable.":
    "Uma reta consegue deixar todos os pontos da classe 1 de um lado e todos os da classe 0 do outro. Este conjunto de dados é linearmente separável.",
  "A straight line can put every class-1 point on one side and every class-0 point on the other. This dataset is not linearly separable.":
    "Uma reta consegue deixar todos os pontos da classe 1 de um lado e todos os da classe 0 do outro. Este conjunto de dados não é linearmente separável.",
  Limitation: "Limitação",
  "One neuron with these raw inputs can only separate classes with a straight boundary. A network with nonlinear hidden layers can learn more flexible features.":
    "Um neurônio com estas entradas brutas só consegue separar classes com uma fronteira reta. Uma rede com camadas ocultas não lineares pode aprender características mais flexíveis.",
  "Next: hidden layers and back-propagation": "Próximo: camadas ocultas e retropropagação",
  "the line {0}": "a reta {0}",
  "none — every point gets the same prediction":
    "nenhuma — todos os pontos recebem a mesma previsão",
  "outside the visible area — every visible point gets the same prediction":
    "fora da área visível — todos os pontos visíveis recebem a mesma previsão",
  "Decision plot: {0} training points, {1} misclassified. Decision boundary: {2}.":
    "Gráfico de decisão: {0} pontos de treino, {1} classificados errado. Fronteira de decisão: {2}.",
  "Class {0}": "Classe {0}",
  Selected: "Selecionado",
  "P(class 1)": "P(classe 1)",
  "Network: 2 inputs → 1 neuron. w₁ = {0}, w₂ = {1}, b = {2}; weighted sum, then {3} activation.":
    "Rede: 2 entradas → 1 neurônio. w₁ = {0}, w₂ = {1}, b = {2}; soma ponderada, depois ativação {3}.",
  step: "degrau",
  sigmoid: "sigmoide",
  "2 inputs → 1 neuron": "2 entradas → 1 neurônio",
  "one neuron": "um neurônio",
  "bias input": "entrada do viés",
  "positive weight": "peso positivo",
  "negative weight": "peso negativo",
  "thicker line = larger magnitude": "linha mais grossa = magnitude maior",
  "if z ≥ 0, otherwise": "se z ≥ 0; caso contrário,",
  "if p ≥ 0.5, otherwise": "se p ≥ 0,5; caso contrário,",
  "Update rule": "Regra de atualização",
  "The perceptron rule: a correct prediction gives error 0, so nothing changes; a mistake moves the line toward the point.":
    "A regra do perceptron: uma previsão correta dá erro 0, então nada muda; um erro move a reta em direção ao ponto.",
  "Stochastic gradient descent on binary cross-entropy: the error uses the probability, so even a correctly classified point nudges the weights.":
    "Descida do gradiente estocástica na entropia cruzada binária: o erro usa a probabilidade, então até um ponto classificado corretamente ajusta os pesos.",
  "Selected point with current weights": "Ponto selecionado com os pesos atuais",
  "Last training update": "Última atualização do treino",
  "Before:": "Antes:",
  "After:": "Depois:",
  "No training update yet.": "Nenhuma atualização de treino ainda.",
  "2 clusters": "2 grupos",
  Moons: "Luas",
  "Step — perceptron": "Degrau — perceptron",
  "Sigmoid — logistic regression": "Sigmoide — regressão logística",
  "Inputs: the selected point has x₁ = {0} and x₂ = {1}; the bias input is always 1.":
    "Entradas: o ponto selecionado tem x₁ = {0} e x₂ = {1}; a entrada do viés é sempre 1.",
  "Weights: w₁ = {0}, w₂ = {1}. The line shows the boundary's direction; the arrow points toward the class-1 side.":
    "Pesos: w₁ = {0}, w₂ = {1}. A linha mostra a direção da fronteira; a seta aponta para o lado da classe 1.",
  "no direction yet": "sem direção ainda",
  "→ class-1 side": "→ lado da classe 1",
  "Bias: b = {0}. The dashed line is the same boundary with b = 0; the arrow shows the shift.":
    "Viés: b = {0}. A linha tracejada é a mesma fronteira com b = 0; a seta mostra o deslocamento.",
  current: "atual",
  "Weighted sum for the selected point: {0} → z = {1}, so class {2}.":
    "Soma ponderada do ponto selecionado: {0} → z = {1}, portanto classe {2}.",
  "Step activation: z = {0} gives ŷ = {1}.": "Ativação degrau: z = {0} dá ŷ = {1}.",
  "Sigmoid activation: z = {0} gives p = {1}.": "Ativação sigmoide: z = {0} dá p = {1}.",
  "Learning rate: step uses η = {0}, sigmoid uses η = {1}; arrow length shows the step size.":
    "Taxa de aprendizado: o degrau usa η = {0}, a sigmoide usa η = {1}; o comprimento da seta mostra o tamanho do passo.",
  "Epoch {0} of {1}. Each epoch visits all {2} points once.":
    "Época {0} de {1}. Cada época visita todos os {2} pontos uma vez.",
  "{0} points per epoch": "{0} pontos por época",
  "Linear separability: this dataset is linearly separable.":
    "Separabilidade linear: este conjunto de dados é linearmente separável.",
  "Linear separability: this dataset is not linearly separable.":
    "Separabilidade linear: este conjunto de dados não é linearmente separável.",
  "one line works": "uma reta resolve",
  "no line works": "nenhuma reta resolve",
}
