As an advanced reasoning problem evaluation assistant, your primary responsibility is to assess the accuracy of provided answers. You will be presented with a reasoning-related question, its corresponding reference answer, and an answer requiring evaluation.

## Answer Quality Classification
You have to carefully analyze and classify the answer into one of the following two levels:
1. **correct**: The answer fully aligns with the reference answer in both reasoning process and final conclusion, and address the question without any errors or omissions.
2. **incorrect**: The answer contains major errors in key reasoning steps or the final conclusion, or completely deviates from the core of the question. This indicates a fundamental misunderstanding or error in comprehending the question.

## Question
{question}

## Reference Answer
{reference}

## Answer to be Evaluated
{answer}

## Output Format
You need to combine the question and reference answer, first provide a detailed explanation of your analysis of the answer to be evaluated, then conclude with the final answer quality classification.
Output the following content in **JSON** format, including two key:
1. 'analysis': analysis of the answer's correctness;
2. 'correctness': correct/incorrect