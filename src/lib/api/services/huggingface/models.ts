/**
 * Hugging Face Models Configuration
 * Defines model endpoints and task-specific configurations
 */

// Model endpoints configuration
export const HF_MODELS = {
  summarization: 'facebook/bart-large-cnn',
  textGeneration: 'EleutherAI/gpt-neo-1.3B',  // More powerful model for text generation
  sentiment: 'distilbert-base-uncased-finetuned-sst-2-english',
  questionAnswering: 'deepset/roberta-base-squad2'
};

// Default parameters for specific model tasks
export const MODEL_PARAMETERS = {
  summarization: {
    min_length: 50,
    max_length: 250,
    do_sample: false
  },
  textGeneration: {
    max_length: 150,
    temperature: 0.7,
    top_p: 0.9,
    do_sample: true
  },
  questionAnswering: {
    handleLongInput: true
  }
};

/**
 * Get appropriate model based on task type
 * @param task - Task type (summarization, generation, etc.)
 */
export function getModelForTask(task: string): string {
  switch (task.toLowerCase()) {
    case 'summary':
    case 'summarization':
      return HF_MODELS.summarization;
    
    case 'generation':
    case 'text-generation':
    case 'socialpost':
      return HF_MODELS.textGeneration;
      
    case 'qa':
    case 'question-answering':
    case 'quotes':
    case 'keyquotes':
      return HF_MODELS.questionAnswering;
      
    case 'sentiment':
    case 'sentiment-analysis':
      return HF_MODELS.sentiment;
      
    default:
      throw new Error(`Unknown task type: ${task}`);
  }
}

/**
 * Get parameters for a specific model and task
 * @param model - Model ID
 * @param task - Task type
 * @param customParams - Custom parameters to override defaults
 */
export function getModelParams(model: string, task: string, customParams: Record<string, any> = {}): Record<string, any> {
  let defaultParams = {};
  
  // Get default parameters based on task
  switch (task.toLowerCase()) {
    case 'summary':
    case 'summarization':
      defaultParams = MODEL_PARAMETERS.summarization;
      break;
    
    case 'generation':
    case 'text-generation':
    case 'socialpost':
      defaultParams = MODEL_PARAMETERS.textGeneration;
      break;
      
    case 'qa':
    case 'question-answering':
    case 'quotes':
    case 'keyquotes':
      defaultParams = MODEL_PARAMETERS.questionAnswering;
      break;
  }
  
  // Merge defaults with custom parameters
  return {
    ...defaultParams,
    ...customParams
  };
}
