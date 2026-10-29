import type { ComponentType } from "react"

import type { LessonEntry } from "@/curriculum"
import { AdaptationLabLesson } from "./generative-ai/adaptation-lab"
import { AssistantLabLesson } from "./generative-ai/assistant-lab"
import { FoundationModelsLesson } from "./generative-ai/foundation-models"
import { GptToChatGptLesson } from "./generative-ai/gpt-to-chatgpt"
import { NextTokenLabLesson } from "./generative-ai/next-token-lab"
import { PostTrainingLesson } from "./generative-ai/post-training"
import { PretrainingLesson } from "./generative-ai/pretraining"
import { TrainingIntuitionDpoLesson } from "./generative-ai/training-intuition-dpo"
import { TrainingIntuitionPretrainingLesson } from "./generative-ai/training-intuition-pretraining"
import { TrainingIntuitionRlhfLesson } from "./generative-ai/training-intuition-rlhf"
import { TransformerArchitectureLesson } from "./generative-ai/transformer-architecture"
import { EmbeddingsLesson } from "./llm/embeddings"
import { BiasAndVarianceLesson } from "./machine-learning/bias-and-variance"
import { ClassificationFairnessLesson } from "./machine-learning/classification-fairness"
import { ClassificationMetricsLesson } from "./machine-learning/classification-metrics"
import { ClusteringMetricsLesson } from "./machine-learning/clustering-metrics"
import { ComponentsLesson } from "./machine-learning/components"
import { DataSplitsLesson } from "./machine-learning/data-splits"
import { FairnessLesson } from "./machine-learning/fairness"
import { GeneralizationLesson } from "./machine-learning/generalization"
import { RankingMetricsLesson } from "./machine-learning/ranking-metrics"
import { RegressionMetricsLesson } from "./machine-learning/regression-metrics"
import { ReinforcementLearningMetricsLesson } from "./machine-learning/reinforcement-learning-metrics"
import { SummaryLesson } from "./machine-learning/summary"
import { ActivationFunctionsLesson } from "./neural-networks/activation-functions"
import { BackPropagationLabLesson } from "./neural-networks/back-propagation"
import { BackPropagationForwardBackwardLesson } from "./neural-networks/back-propagation-forward-backward"
import { BackPropagationOverviewLesson } from "./neural-networks/back-propagation-overview"
import { BackPropagationUnderTheHoodLesson } from "./neural-networks/back-propagation-theory"
import { PerceptronLesson } from "./neural-networks/perceptron"
import { ContentLesson } from "./programming-vs-ml/content"
import { MachineLearningLesson } from "./programming-vs-ml/machine-learning"
import { ProblemLesson } from "./programming-vs-ml/problem"
import { ProgrammingLesson } from "./programming-vs-ml/programming"

/** Lessons with written content, keyed `chapter/lesson`. Others render a placeholder. */
export const lessonPages: Record<string, ComponentType<{ entry: LessonEntry }>> = {
  "programming-vs-ml/content": ContentLesson,
  "programming-vs-ml/problem": ProblemLesson,
  "programming-vs-ml/programming": ProgrammingLesson,
  "programming-vs-ml/machine-learning": MachineLearningLesson,
  "machine-learning/components": ComponentsLesson,
  "machine-learning/generalization": GeneralizationLesson,
  "machine-learning/summary": SummaryLesson,
  "machine-learning/bias-and-variance": BiasAndVarianceLesson,
  "machine-learning/fairness": FairnessLesson,
  "machine-learning/data-splits": DataSplitsLesson,
  "machine-learning/classification-metrics": ClassificationMetricsLesson,
  "machine-learning/classification-fairness": ClassificationFairnessLesson,
  "machine-learning/clustering-metrics": ClusteringMetricsLesson,
  "machine-learning/regression-metrics": RegressionMetricsLesson,
  "machine-learning/reinforcement-learning-metrics": ReinforcementLearningMetricsLesson,
  "machine-learning/ranking-metrics": RankingMetricsLesson,
  "neural-networks/back-propagation": BackPropagationOverviewLesson,
  "neural-networks/training-lab": BackPropagationLabLesson,
  "neural-networks/forward-and-backward": BackPropagationForwardBackwardLesson,
  "neural-networks/under-the-hood": BackPropagationUnderTheHoodLesson,
  "neural-networks/perceptron": PerceptronLesson,
  "neural-networks/activation-functions": ActivationFunctionsLesson,
  "generative-ai/foundation-models": FoundationModelsLesson,
  "generative-ai/next-token-lab": NextTokenLabLesson,
  "generative-ai/adaptation-lab": AdaptationLabLesson,
  "generative-ai/assistant-lab": AssistantLabLesson,
  "generative-ai/gpt-to-chatgpt": GptToChatGptLesson,
  "generative-ai/intuition-pretraining": TrainingIntuitionPretrainingLesson,
  "generative-ai/intuition-rlhf": TrainingIntuitionRlhfLesson,
  "generative-ai/intuition-dpo": TrainingIntuitionDpoLesson,
  "generative-ai/transformer-architecture": TransformerArchitectureLesson,
  "generative-ai/pretraining": PretrainingLesson,
  "generative-ai/post-training": PostTrainingLesson,
  "llm/embeddings": EmbeddingsLesson,
}
