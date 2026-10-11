import type { ComponentType } from "react"

import type { LessonEntry } from "@/curriculum"
import { BiasAndVarianceLesson } from "./machine-learning/bias-and-variance"
import { ClassificationMetricsLesson } from "./machine-learning/classification-metrics"
import { ClusteringMetricsLesson } from "./machine-learning/clustering-metrics"
import { ComponentsLesson } from "./machine-learning/components"
import { DataSplitsLesson } from "./machine-learning/data-splits"
import { SummaryLesson } from "./machine-learning/summary"
import { FairnessLesson } from "./machine-learning/fairness"
import { GeneralizationLesson } from "./machine-learning/generalization"
import { RankingMetricsLesson } from "./machine-learning/ranking-metrics"
import { RegressionMetricsLesson } from "./machine-learning/regression-metrics"
import { ReinforcementLearningMetricsLesson } from "./machine-learning/reinforcement-learning-metrics"
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
  "machine-learning/clustering-metrics": ClusteringMetricsLesson,
  "machine-learning/regression-metrics": RegressionMetricsLesson,
  "machine-learning/reinforcement-learning-metrics": ReinforcementLearningMetricsLesson,
  "machine-learning/ranking-metrics": RankingMetricsLesson,
  "neural-networks/perceptron": PerceptronLesson,
}
