import { GoogleGenerativeAI } from '@google/generative-ai';
import logger from '../utils/logger';

class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not defined in environment variables');
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    // Use gemini-1.5-flash which is available in the current API
    const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
    this.model = this.genAI.getGenerativeModel({ 
      model: modelName
    });
    console.log('✅ Gemini service initialized with model:', modelName);
  }

  // Generate interview questions based on role and resume
  async generateInterviewQuestions(params: {
    role: string;
    experienceLevel: string;
    interviewType: string;
    resumeContext?: any;
    difficulty: string;
    count: number;
  }): Promise<any[]> {
    console.log('=== GENERATING INTERVIEW QUESTIONS ===');
    console.log('Params:', JSON.stringify(params, null, 2));
    
    try {
      const prompt = this.buildQuestionGenerationPrompt(params);
      console.log('Prompt length:', prompt.length);
      
      console.log('Calling Gemini API...');
      const result = await this.model.generateContent(prompt);
      console.log('Gemini API responded');
      
      const response = await result.response;
      const text = response.text();
      console.log('Response text length:', text.length);
      console.log('Response text preview:', text.substring(0, 200));

      // Try to parse the JSON response
      let questions;
      try {
        // Remove markdown code blocks if present
        const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        questions = JSON.parse(cleanText);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        console.error('Raw text:', text);
        
        // Fallback: Generate default questions
        console.log('Using fallback questions due to parse error...');
        return this.generateFallbackQuestions(params);
      }
      
      // Ensure questions is an array
      if (!Array.isArray(questions)) {
        if (questions.questions && Array.isArray(questions.questions)) {
          questions = questions.questions;
        } else {
          console.error('Questions is not an array:', questions);
          return this.generateFallbackQuestions(params);
        }
      }
      
      logger.info(`Generated ${questions.length} questions for ${params.role} role`);
      console.log(`✅ Successfully generated ${questions.length} questions`);
      return questions;

    } catch (error: any) {
      console.error('=== ERROR GENERATING QUESTIONS ===');
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      logger.error('Error generating interview questions:', error);
      
      // Return fallback questions instead of throwing
      console.log('⚠️ Returning fallback questions due to error...');
      return this.generateFallbackQuestions(params);
    }
  }

  // Generate fallback questions when AI fails
  private generateFallbackQuestions(params: {
    role: string;
    interviewType: string;
    difficulty: string;
    count: number;
  }): any[] {
    console.log('Generating fallback questions for:', params.role, params.interviewType);
    
    // Special fallback for coding interviews
    if (params.interviewType === 'coding') {
      const codingQuestions = [
        // Easy - Arrays
        {
          id: `q_${Date.now()}_1`,
          text: "Two Sum",
          description: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.",
          type: 'coding',
          difficulty: params.difficulty,
          expectedDuration: 15,
          category: 'arrays',
          examples: [
            {
              input: "nums = [2,7,11,15], target = 9",
              output: "[0,1]",
              explanation: "Because nums[0] + nums[1] == 9, we return [0, 1]."
            },
            {
              input: "nums = [3,2,4], target = 6",
              output: "[1,2]",
              explanation: "Because nums[1] + nums[2] == 6, we return [1, 2]."
            }
          ],
          constraints: [
            "2 <= nums.length <= 10^4",
            "-10^9 <= nums[i] <= 10^9",
            "-10^9 <= target <= 10^9",
            "Only one valid answer exists."
          ],
          testCases: [
            { input: "[2,7,11,15]\n9", expectedOutput: "[0,1]" },
            { input: "[3,2,4]\n6", expectedOutput: "[1,2]" },
            { input: "[3,3]\n6", expectedOutput: "[0,1]" }
          ],
          followUpQuestions: [
            "What is the time complexity of your solution?",
            "Can you optimize the space complexity?",
            "How would you handle duplicate numbers?"
          ]
        },
        // Easy - Strings
        {
          id: `q_${Date.now()}_2`,
          text: "Valid Anagram",
          description: "Given two strings s and t, return true if t is an anagram of s, and false otherwise.\n\nAn Anagram is a word or phrase formed by rearranging the letters of a different word or phrase, typically using all the original letters exactly once.",
          type: 'coding',
          difficulty: params.difficulty,
          expectedDuration: 10,
          category: 'strings',
          examples: [
            {
              input: 's = "anagram", t = "nagaram"',
              output: 'true',
              explanation: "Both strings contain the same characters with the same frequencies."
            },
            {
              input: 's = "rat", t = "car"',
              output: 'false',
              explanation: "The strings contain different characters."
            }
          ],
          constraints: [
            "1 <= s.length, t.length <= 5 * 10^4",
            "s and t consist of lowercase English letters."
          ],
          testCases: [
            { input: '"anagram"\n"nagaram"', expectedOutput: 'true' },
            { input: '"rat"\n"car"', expectedOutput: 'false' },
            { input: '"a"\n"ab"', expectedOutput: 'false' }
          ],
          followUpQuestions: [
            "What if the inputs contain Unicode characters?",
            "Can you solve it in O(n) time?",
            "What data structure would you use?"
          ]
        },
        // Medium - Stack
        {
          id: `q_${Date.now()}_3`,
          text: "Valid Parentheses",
          description: "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.\n\nAn input string is valid if:\n1. Open brackets must be closed by the same type of brackets.\n2. Open brackets must be closed in the correct order.\n3. Every close bracket has a corresponding open bracket of the same type.",
          type: 'coding',
          difficulty: params.difficulty,
          expectedDuration: 15,
          category: 'stack',
          examples: [
            {
              input: 's = "()"',
              output: 'true',
              explanation: "The string has valid parentheses."
            },
            {
              input: 's = "()[]{}"',
              output: 'true',
              explanation: "All brackets are properly closed."
            },
            {
              input: 's = "(]"',
              output: 'false',
              explanation: "Brackets are not properly matched."
            }
          ],
          constraints: [
            "1 <= s.length <= 10^4",
            "s consists of parentheses only '()[]{}'."
          ],
          testCases: [
            { input: '"()"', expectedOutput: 'true' },
            { input: '"()[]{}"', expectedOutput: 'true' },
            { input: '"(]"', expectedOutput: 'false' },
            { input: '"([)]"', expectedOutput: 'false' },
            { input: '"{[]}"', expectedOutput: 'true' }
          ],
          followUpQuestions: [
            "What data structure did you use?",
            "What is the space complexity?",
            "How would you handle nested brackets?"
          ]
        },
        // Medium - Arrays
        {
          id: `q_${Date.now()}_4`,
          text: "Product of Array Except Self",
          description: "Given an integer array nums, return an array answer such that answer[i] is equal to the product of all the elements of nums except nums[i].\n\nThe product of any prefix or suffix of nums is guaranteed to fit in a 32-bit integer.\n\nYou must write an algorithm that runs in O(n) time and without using the division operation.",
          type: 'coding',
          difficulty: params.difficulty,
          expectedDuration: 20,
          category: 'arrays',
          examples: [
            {
              input: 'nums = [1,2,3,4]',
              output: '[24,12,8,6]',
              explanation: "answer[0] = 2*3*4 = 24, answer[1] = 1*3*4 = 12, answer[2] = 1*2*4 = 8, answer[3] = 1*2*3 = 6"
            },
            {
              input: 'nums = [-1,1,0,-3,3]',
              output: '[0,0,9,0,0]',
              explanation: "The product of all elements except the zero is 0."
            }
          ],
          constraints: [
            "2 <= nums.length <= 10^5",
            "-30 <= nums[i] <= 30",
            "The product of any prefix or suffix of nums is guaranteed to fit in a 32-bit integer."
          ],
          testCases: [
            { input: '[1,2,3,4]', expectedOutput: '[24,12,8,6]' },
            { input: '[-1,1,0,-3,3]', expectedOutput: '[0,0,9,0,0]' },
            { input: '[1,2]', expectedOutput: '[2,1]' }
          ],
          followUpQuestions: [
            "Can you solve it without using division?",
            "What is the space complexity?",
            "Can you do it in O(1) extra space?"
          ]
        },
        // Medium - Dynamic Programming
        {
          id: `q_${Date.now()}_5`,
          text: "Maximum Subarray (Kadane's Algorithm)",
          description: "Given an integer array nums, find the subarray with the largest sum, and return its sum.\n\nA subarray is a contiguous non-empty sequence of elements within an array.",
          type: 'coding',
          difficulty: params.difficulty,
          expectedDuration: 20,
          category: 'dynamic-programming',
          examples: [
            {
              input: 'nums = [-2,1,-3,4,-1,2,1,-5,4]',
              output: '6',
              explanation: "The subarray [4,-1,2,1] has the largest sum 6."
            },
            {
              input: 'nums = [1]',
              output: '1',
              explanation: "The subarray [1] has the largest sum 1."
            },
            {
              input: 'nums = [5,4,-1,7,8]',
              output: '23',
              explanation: "The subarray [5,4,-1,7,8] has the largest sum 23."
            }
          ],
          constraints: [
            "1 <= nums.length <= 10^5",
            "-10^4 <= nums[i] <= 10^4"
          ],
          testCases: [
            { input: '[-2,1,-3,4,-1,2,1,-5,4]', expectedOutput: '6' },
            { input: '[1]', expectedOutput: '1' },
            { input: '[5,4,-1,7,8]', expectedOutput: '23' }
          ],
          followUpQuestions: [
            "Can you solve it using Kadane's algorithm?",
            "What is the time complexity?",
            "How would you find the actual subarray, not just the sum?"
          ]
        },
        // Medium - Linked Lists
        {
          id: `q_${Date.now()}_6`,
          text: "Reverse Linked List",
          description: "Given the head of a singly linked list, reverse the list, and return the reversed list.\n\nA linked list can be reversed either iteratively or recursively. Could you implement both?",
          type: 'coding',
          difficulty: params.difficulty,
          expectedDuration: 15,
          category: 'linked-lists',
          examples: [
            {
              input: 'head = [1,2,3,4,5]',
              output: '[5,4,3,2,1]',
              explanation: "The linked list is reversed."
            },
            {
              input: 'head = [1,2]',
              output: '[2,1]',
              explanation: "The linked list is reversed."
            },
            {
              input: 'head = []',
              output: '[]',
              explanation: "Empty list remains empty."
            }
          ],
          constraints: [
            "The number of nodes in the list is the range [0, 5000].",
            "-5000 <= Node.val <= 5000"
          ],
          testCases: [
            { input: '[1,2,3,4,5]', expectedOutput: '[5,4,3,2,1]' },
            { input: '[1,2]', expectedOutput: '[2,1]' },
            { input: '[]', expectedOutput: '[]' }
          ],
          followUpQuestions: [
            "Can you do it recursively?",
            "What is the space complexity of each approach?",
            "How would you reverse only part of the list?"
          ]
        },
        // Medium - Binary Search
        {
          id: `q_${Date.now()}_7`,
          text: "Search in Rotated Sorted Array",
          description: "There is an integer array nums sorted in ascending order (with distinct values).\n\nPrior to being passed to your function, nums is possibly rotated at an unknown pivot index k (1 <= k < nums.length) such that the resulting array is [nums[k], nums[k+1], ..., nums[n-1], nums[0], nums[1], ..., nums[k-1]] (0-indexed).\n\nGiven the array nums after the possible rotation and an integer target, return the index of target if it is in nums, or -1 if it is not in nums.\n\nYou must write an algorithm with O(log n) runtime complexity.",
          type: 'coding',
          difficulty: params.difficulty,
          expectedDuration: 25,
          category: 'binary-search',
          examples: [
            {
              input: 'nums = [4,5,6,7,0,1,2], target = 0',
              output: '4',
              explanation: "The target 0 is at index 4."
            },
            {
              input: 'nums = [4,5,6,7,0,1,2], target = 3',
              output: '-1',
              explanation: "The target 3 is not in the array."
            },
            {
              input: 'nums = [1], target = 0',
              output: '-1',
              explanation: "The target 0 is not in the array."
            }
          ],
          constraints: [
            "1 <= nums.length <= 5000",
            "-10^4 <= nums[i] <= 10^4",
            "All values of nums are unique.",
            "nums is an ascending array that is possibly rotated.",
            "-10^4 <= target <= 10^4"
          ],
          testCases: [
            { input: '[4,5,6,7,0,1,2]\n0', expectedOutput: '4' },
            { input: '[4,5,6,7,0,1,2]\n3', expectedOutput: '-1' },
            { input: '[1]\n0', expectedOutput: '-1' }
          ],
          followUpQuestions: [
            "How do you determine which half is sorted?",
            "What is the time complexity?",
            "Can you handle duplicates?"
          ]
        },
        // Hard - Trees
        {
          id: `q_${Date.now()}_8`,
          text: "Binary Tree Maximum Path Sum",
          description: "A path in a binary tree is a sequence of nodes where each pair of adjacent nodes in the sequence has an edge connecting them. A node can only appear in the sequence at most once. Note that the path does not need to pass through the root.\n\nThe path sum of a path is the sum of the node's values in the path.\n\nGiven the root of a binary tree, return the maximum path sum of any non-empty path.",
          type: 'coding',
          difficulty: params.difficulty,
          expectedDuration: 30,
          category: 'trees',
          examples: [
            {
              input: 'root = [1,2,3]',
              output: '6',
              explanation: "The optimal path is 2 -> 1 -> 3 with a path sum of 2 + 1 + 3 = 6."
            },
            {
              input: 'root = [-10,9,20,null,null,15,7]',
              output: '42',
              explanation: "The optimal path is 15 -> 20 -> 7 with a path sum of 15 + 20 + 7 = 42."
            }
          ],
          constraints: [
            "The number of nodes in the tree is in the range [1, 3 * 10^4].",
            "-1000 <= Node.val <= 1000"
          ],
          testCases: [
            { input: '[1,2,3]', expectedOutput: '6' },
            { input: '[-10,9,20,null,null,15,7]', expectedOutput: '42' },
            { input: '[1]', expectedOutput: '1' }
          ],
          followUpQuestions: [
            "How do you handle negative values?",
            "What is the time complexity?",
            "Can you explain your recursive approach?"
          ]
        },
        // Hard - Dynamic Programming
        {
          id: `q_${Date.now()}_9`,
          text: "Longest Increasing Subsequence",
          description: "Given an integer array nums, return the length of the longest strictly increasing subsequence.\n\nA subsequence is an array that can be derived from another array by deleting some or no elements without changing the order of the remaining elements.",
          type: 'coding',
          difficulty: params.difficulty,
          expectedDuration: 25,
          category: 'dynamic-programming',
          examples: [
            {
              input: 'nums = [10,9,2,5,3,7,101,18]',
              output: '4',
              explanation: "The longest increasing subsequence is [2,3,7,101], therefore the length is 4."
            },
            {
              input: 'nums = [0,1,0,3,2,3]',
              output: '4',
              explanation: "The longest increasing subsequence is [0,1,2,3]."
            },
            {
              input: 'nums = [7,7,7,7,7,7,7]',
              output: '1',
              explanation: "All elements are the same, so the longest increasing subsequence is just one element."
            }
          ],
          constraints: [
            "1 <= nums.length <= 2500",
            "-10^4 <= nums[i] <= 10^4"
          ],
          testCases: [
            { input: '[10,9,2,5,3,7,101,18]', expectedOutput: '4' },
            { input: '[0,1,0,3,2,3]', expectedOutput: '4' },
            { input: '[7,7,7,7,7,7,7]', expectedOutput: '1' }
          ],
          followUpQuestions: [
            "Can you solve it in O(n log n) time?",
            "What is the space complexity?",
            "How would you find the actual subsequence?"
          ]
        },
        // Medium - Two Pointers
        {
          id: `q_${Date.now()}_10`,
          text: "Container With Most Water",
          description: "You are given an integer array height of length n. There are n vertical lines drawn such that the two endpoints of the ith line are (i, 0) and (i, height[i]).\n\nFind two lines that together with the x-axis form a container, such that the container contains the most water.\n\nReturn the maximum amount of water a container can store.\n\nNotice that you may not slant the container.",
          type: 'coding',
          difficulty: params.difficulty,
          expectedDuration: 20,
          category: 'two-pointers',
          examples: [
            {
              input: 'height = [1,8,6,2,5,4,8,3,7]',
              output: '49',
              explanation: "The vertical lines are at indices 1 and 8. The area is min(8,7) * (8-1) = 7 * 7 = 49."
            },
            {
              input: 'height = [1,1]',
              output: '1',
              explanation: "The area is min(1,1) * (1-0) = 1."
            }
          ],
          constraints: [
            "n == height.length",
            "2 <= n <= 10^5",
            "0 <= height[i] <= 10^4"
          ],
          testCases: [
            { input: '[1,8,6,2,5,4,8,3,7]', expectedOutput: '49' },
            { input: '[1,1]', expectedOutput: '1' },
            { input: '[4,3,2,1,4]', expectedOutput: '16' }
          ],
          followUpQuestions: [
            "Why does the two-pointer approach work?",
            "What is the time complexity?",
            "Can you prove the correctness of your algorithm?"
          ]
        }
      ];
      
      // Return appropriate number based on difficulty and count
      return codingQuestions.slice(0, Math.min(params.count, codingQuestions.length));
    }
    
    // Regular behavioral/technical questions
    const fallbackQuestions = [
      {
        id: `q_${Date.now()}_1`,
        text: `Tell me about your experience as a ${params.role}. What are your key responsibilities?`,
        type: 'behavioral',
        difficulty: params.difficulty,
        expectedDuration: 5,
        category: 'experience',
        followUpQuestions: [
          'What was your biggest achievement in this role?',
          'What challenges did you face?'
        ]
      },
      {
        id: `q_${Date.now()}_2`,
        text: `Describe a challenging project you worked on. How did you approach it?`,
        type: 'behavioral',
        difficulty: params.difficulty,
        expectedDuration: 5,
        category: 'problem-solving',
        followUpQuestions: [
          'What would you do differently?',
          'What did you learn from this experience?'
        ]
      },
      {
        id: `q_${Date.now()}_3`,
        text: `What technical skills are most important for a ${params.role}? How have you developed these skills?`,
        type: 'technical',
        difficulty: params.difficulty,
        expectedDuration: 5,
        category: 'technical-skills',
        followUpQuestions: [
          'Can you give an example of using these skills?',
          'How do you stay updated with new technologies?'
        ]
      },
      {
        id: `q_${Date.now()}_4`,
        text: `How do you handle tight deadlines and pressure in your work?`,
        type: 'behavioral',
        difficulty: params.difficulty,
        expectedDuration: 5,
        category: 'work-style',
        followUpQuestions: [
          'Can you give a specific example?',
          'What strategies do you use to manage stress?'
        ]
      },
      {
        id: `q_${Date.now()}_5`,
        text: `Where do you see yourself in the next 3-5 years in your career as a ${params.role}?`,
        type: 'behavioral',
        difficulty: params.difficulty,
        expectedDuration: 5,
        category: 'career-goals',
        followUpQuestions: [
          'What steps are you taking to achieve these goals?',
          'How does this position fit into your career plan?'
        ]
      },
      {
        id: `q_${Date.now()}_6`,
        text: `Describe your approach to learning new technologies or skills required for a ${params.role}.`,
        type: 'behavioral',
        difficulty: params.difficulty,
        expectedDuration: 5,
        category: 'learning',
        followUpQuestions: [
          'What was the last new skill you learned?',
          'How long did it take you to become proficient?'
        ]
      },
      {
        id: `q_${Date.now()}_7`,
        text: `Tell me about a time when you had to work with a difficult team member. How did you handle it?`,
        type: 'behavioral',
        difficulty: params.difficulty,
        expectedDuration: 5,
        category: 'teamwork',
        followUpQuestions: [
          'What was the outcome?',
          'What would you do differently?'
        ]
      },
      {
        id: `q_${Date.now()}_8`,
        text: `What do you consider your greatest strength as a ${params.role}? Can you provide an example?`,
        type: 'behavioral',
        difficulty: params.difficulty,
        expectedDuration: 5,
        category: 'strengths',
        followUpQuestions: [
          'How has this strength helped you in your career?',
          'How do you continue to develop this strength?'
        ]
      },
      {
        id: `q_${Date.now()}_9`,
        text: `Describe a situation where you had to make a difficult decision. What was your thought process?`,
        type: 'behavioral',
        difficulty: params.difficulty,
        expectedDuration: 5,
        category: 'decision-making',
        followUpQuestions: [
          'What was the outcome of your decision?',
          'Would you make the same decision again?'
        ]
      }
    ];
    
    // Return the requested number of questions
    return fallbackQuestions.slice(0, params.count);
  }

  // Analyze interview response
  async analyzeResponse(params: {
    question: string;
    answer: string;
    role: string;
    expectedKeywords?: string[];
    context?: any;
  }): Promise<any> {
    console.log('=== ANALYZING RESPONSE ===');
    console.log('Question:', params.question.substring(0, 50) + '...');
    console.log('Answer length:', params.answer.length);
    
    try {
      const prompt = this.buildResponseAnalysisPrompt(params);
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Try to parse the JSON response
      let analysis;
      try {
        const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        analysis = JSON.parse(cleanText);
      } catch (parseError) {
        console.error('JSON parse error in analysis:', parseError);
        // Return fallback analysis
        return this.generateFallbackAnalysis(params);
      }
      
      logger.info(`Analyzed response for question: ${params.question.substring(0, 50)}...`);
      console.log('✅ Response analyzed successfully');
      return analysis;

    } catch (error: any) {
      console.error('=== ERROR ANALYZING RESPONSE ===');
      console.error('Error:', error.message);
      logger.error('Error analyzing response:', error);
      
      // Return fallback analysis instead of throwing
      console.log('⚠️ Returning fallback analysis...');
      return this.generateFallbackAnalysis(params);
    }
  }

  // Generate fallback analysis when AI fails
  private generateFallbackAnalysis(params: {
    question: string;
    answer: string;
    role: string;
  }): any {
    console.log('Generating fallback analysis...');
    
    // Simple heuristic-based analysis
    const answerLength = params.answer.length;
    const wordCount = params.answer.split(/\s+/).length;
    const hasExamples = /example|instance|case|situation|time when/i.test(params.answer);
    const hasTechnicalTerms = /\b(code|system|design|implement|develop|build|test|deploy)\b/i.test(params.answer);
    
    // Calculate basic scores
    const lengthScore = Math.min(100, (answerLength / 500) * 100);
    const wordCountScore = Math.min(100, (wordCount / 100) * 100);
    const exampleScore = hasExamples ? 85 : 60;
    const technicalScore = hasTechnicalTerms ? 85 : 70;
    
    const overallScore = Math.round((lengthScore + wordCountScore + exampleScore + technicalScore) / 4);
    
    return {
      scores: {
        relevance: Math.min(100, overallScore + 5),
        technicalAccuracy: technicalScore,
        clarity: Math.min(100, wordCountScore),
        structure: Math.min(100, lengthScore),
        depth: exampleScore,
        examples: hasExamples ? 85 : 60
      },
      overallScore,
      strengths: [
        hasExamples ? 'Provided concrete examples' : 'Clear communication',
        hasTechnicalTerms ? 'Demonstrated technical knowledge' : 'Good articulation',
        wordCount > 50 ? 'Comprehensive answer' : 'Concise response'
      ],
      improvements: [
        !hasExamples ? 'Include more specific examples' : 'Consider adding more context',
        wordCount < 50 ? 'Provide more detailed explanations' : 'Maintain clarity',
        !hasTechnicalTerms ? 'Include more technical details' : 'Continue demonstrating expertise'
      ],
      missingElements: [],
      keywordMatches: [],
      feedback: `Your response demonstrates ${overallScore >= 75 ? 'strong' : 'good'} understanding. ${hasExamples ? 'The examples you provided add credibility.' : 'Consider adding specific examples to strengthen your answer.'} ${hasTechnicalTerms ? 'Your technical knowledge is evident.' : 'Try to incorporate more technical details where relevant.'}`
    };
  }

  // Generate comprehensive feedback
  async generateFeedback(params: {
    interviewData: any;
    analysisResults: any;
    userProfile: any;
  }): Promise<any> {
    console.log('=== GENERATING FEEDBACK ===');
    console.log('Interview type:', params.interviewData.type);
    
    try {
      const prompt = this.buildFeedbackPrompt(params);
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Try to parse the JSON response
      let feedback;
      try {
        const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        feedback = JSON.parse(cleanText);
      } catch (parseError) {
        console.error('JSON parse error in feedback:', parseError);
        // Return fallback feedback
        return this.generateFallbackFeedback(params);
      }
      
      logger.info(`Generated comprehensive feedback for interview ${params.interviewData.id}`);
      console.log('✅ Feedback generated successfully');
      return feedback;

    } catch (error: any) {
      console.error('=== ERROR GENERATING FEEDBACK ===');
      console.error('Error:', error.message);
      logger.error('Error generating feedback:', error);
      
      // Return fallback feedback instead of throwing
      console.log('⚠️ Returning fallback feedback...');
      return this.generateFallbackFeedback(params);
    }
  }

  // Generate fallback feedback when AI fails
  private generateFallbackFeedback(params: {
    interviewData: any;
    analysisResults: any;
    userProfile: any;
  }): any {
    console.log('Generating fallback feedback...');
    
    const { interviewData, analysisResults } = params;
    const completionRate = (interviewData.questionsAnswered / interviewData.totalQuestions) * 100;
    const overallScore = analysisResults?.overallScore || 75;
    
    return {
      overallRating: overallScore,
      strengths: [
        'Completed the interview with good engagement',
        'Demonstrated clear communication skills',
        'Showed understanding of the role requirements'
      ],
      improvements: [
        'Practice providing more specific examples',
        'Work on structuring responses using the STAR method',
        'Continue developing technical knowledge'
      ],
      recommendations: [
        'Review common interview questions for your role',
        'Practice mock interviews to build confidence',
        'Research the company and role thoroughly before interviews'
      ],
      skillAssessment: [],
      nextSteps: [
        'Take more practice interviews to improve',
        'Focus on areas identified for improvement',
        'Review your responses and refine your answers'
      ],
      detailedFeedback: `You completed ${completionRate.toFixed(0)}% of the interview questions. Your overall performance shows ${overallScore >= 80 ? 'strong' : overallScore >= 60 ? 'good' : 'developing'} interview skills. Continue practicing to improve your confidence and response quality. Focus on providing specific examples and demonstrating your expertise clearly.`
    };
  }

  // Generate follow-up questions
  async generateFollowUpQuestions(params: {
    originalQuestion: string;
    userAnswer: string;
    role: string;
    context?: any;
  }): Promise<string[]> {
    try {
      const prompt = this.buildFollowUpPrompt(params);
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const followUps = JSON.parse(text);
      
      return followUps.questions || [];

    } catch (error) {
      logger.error('Error generating follow-up questions:', error);
      return [];
    }
  }

  // Analyze resume content
  async analyzeResume(params: {
    resumeText: string;
    targetRole?: string;
  }): Promise<any> {
    try {
      const prompt = this.buildResumeAnalysisPrompt(params);
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const analysis = JSON.parse(text);
      
      logger.info('Analyzed resume content');
      return analysis;

    } catch (error) {
      logger.error('Error analyzing resume:', error);
      throw new Error('Failed to analyze resume');
    }
  }

  // Generate improvement recommendations
  async generateRecommendations(params: {
    userProfile: any;
    interviewHistory: any[];
    currentPerformance: any;
  }): Promise<any> {
    try {
      const prompt = this.buildRecommendationsPrompt(params);
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const recommendations = JSON.parse(text);
      
      return recommendations;

    } catch (error) {
      logger.error('Error generating recommendations:', error);
      throw new Error('Failed to generate recommendations');
    }
  }

  // Private helper methods for building prompts

  private buildQuestionGenerationPrompt(params: any): string {
    const resumeContext = params.resumeContext ? `

CANDIDATE'S RESUME CONTEXT:
Skills: ${params.resumeContext.skills.join(', ')}
Experience: ${JSON.stringify(params.resumeContext.experience).substring(0, 500)}
Projects: ${JSON.stringify(params.resumeContext.projects).substring(0, 500)}
Summary: ${params.resumeContext.summary}

IMPORTANT: Generate questions that are SPECIFICALLY TAILORED to this candidate's background, skills, and experience. Ask about their specific projects, technologies they've used, and experiences mentioned in their resume.
` : '';

    // Special handling for coding interviews
    if (params.interviewType === 'coding') {
      return `
You are an expert LeetCode-style coding interview question generator. Generate ${params.count} REAL algorithmic coding problems for a ${params.role} position.

Parameters:
- Role: ${params.role}
- Experience Level: ${params.experienceLevel}
- Difficulty: ${params.difficulty}
${resumeContext}

CRITICAL REQUIREMENTS for CODING questions:
1. Each question MUST be a REAL algorithmic problem (like LeetCode, HackerRank, CodeForces)
2. Include COMPLETE problem description with clear input/output format
3. Provide 2-3 worked examples with explanations
4. List all constraints (array size, value ranges, etc.)
5. Provide 3-5 test cases with EXACT inputs and expected outputs
6. Include hints for solving (algorithm approach, data structures)
7. Questions should cover different topics:
   - Arrays & Hashing
   - Two Pointers
   - Sliding Window
   - Stack
   - Binary Search
   - Linked Lists
   - Trees
   - Graphs
   - Dynamic Programming
   - Greedy
   - Backtracking
8. Difficulty should match: ${params.difficulty}
   - easy: Simple loops, basic data structures
   - medium: Multiple data structures, some optimization
   - hard: Complex algorithms, advanced optimization
${params.resumeContext ? '9. Consider the candidate\'s programming languages from resume' : ''}

EXAMPLE FORMAT (follow this EXACTLY):
[
  {
    "id": "q_coding_1",
    "text": "Two Sum",
    "description": "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\\n\\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\\n\\nYou can return the answer in any order.",
    "type": "coding",
    "difficulty": "${params.difficulty}",
    "expectedDuration": 15,
    "category": "arrays",
    "examples": [
      {
        "input": "nums = [2,7,11,15], target = 9",
        "output": "[0,1]",
        "explanation": "Because nums[0] + nums[1] == 9, we return [0, 1]."
      },
      {
        "input": "nums = [3,2,4], target = 6",
        "output": "[1,2]",
        "explanation": "Because nums[1] + nums[2] == 6, we return [1, 2]."
      }
    ],
    "constraints": [
      "2 <= nums.length <= 10^4",
      "-10^9 <= nums[i] <= 10^9",
      "-10^9 <= target <= 10^9",
      "Only one valid answer exists."
    ],
    "testCases": [
      {"input": "[2,7,11,15]\\n9", "expectedOutput": "[0,1]"},
      {"input": "[3,2,4]\\n6", "expectedOutput": "[1,2]"},
      {"input": "[3,3]\\n6", "expectedOutput": "[0,1]"}
    ],
    "followUpQuestions": [
      "What is the time complexity of your solution?",
      "Can you optimize the space complexity?",
      "How would you handle duplicate numbers?"
    ]
  }
]

Generate ${params.count} DIFFERENT LeetCode-style coding problems now. Each must be a REAL algorithmic challenge, NOT behavioral questions.
Make sure each question has:
- Clear problem statement
- Input/output format
- Examples with explanations
- Constraints
- Test cases
- Hints

DO NOT generate behavioral questions like "Tell me about your experience". ONLY generate algorithmic coding problems.
`;
    }

    // Regular interview questions
    return `
You are an expert technical interviewer. Generate ${params.count} interview questions for a ${params.role} position.

Parameters:
- Role: ${params.role}
- Experience Level: ${params.experienceLevel}
- Interview Type: ${params.interviewType}
- Difficulty: ${params.difficulty}
${params.resumeAnalysis ? `- Resume Analysis: ${JSON.stringify(params.resumeAnalysis)}` : ''}
${resumeContext}

Requirements:
1. Questions should be appropriate for the experience level
2. Include a mix of behavioral, technical, and situational questions
3. Questions should be relevant to the specific role
4. Each question should have an expected duration (in minutes)
5. Include follow-up questions where appropriate
${params.resumeContext ? '6. CRITICAL: Questions MUST reference specific skills, projects, or experiences from the resume above' : ''}

Return the response as a JSON array with this structure:
[
  {
    "id": "unique_id",
    "text": "question text",
    "type": "behavioral|technical|coding",
    "difficulty": "easy|medium|hard",
    "expectedDuration": 5,
    "category": "category_name",
    "followUpQuestions": ["follow up 1", "follow up 2"]
  }
]

Generate questions now:
`;
  }

  private buildResponseAnalysisPrompt(params: any): string {
    return `
You are an expert interview analyst. Analyze the following interview response:

Question: "${params.question}"
Answer: "${params.answer}"
Role: ${params.role}
${params.expectedKeywords ? `Expected Keywords: ${params.expectedKeywords.join(', ')}` : ''}

Analyze the response on these dimensions:
1. Relevance to the question (0-100)
2. Technical accuracy (0-100)
3. Communication clarity (0-100)
4. Structure and organization (0-100)
5. Depth of knowledge (0-100)
6. Use of examples (0-100)

Also identify:
- Key strengths in the response
- Areas for improvement
- Missing elements
- Keyword matches
- Overall impression

Return as JSON:
{
  "scores": {
    "relevance": 85,
    "technicalAccuracy": 90,
    "clarity": 80,
    "structure": 75,
    "depth": 85,
    "examples": 70
  },
  "overallScore": 81,
  "strengths": ["strength 1", "strength 2"],
  "improvements": ["improvement 1", "improvement 2"],
  "missingElements": ["element 1", "element 2"],
  "keywordMatches": ["keyword 1", "keyword 2"],
  "feedback": "detailed feedback text"
}
`;
  }

  private buildFeedbackPrompt(params: any): string {
    return `
You are an expert career coach and interview specialist. Generate comprehensive feedback for this interview:

Interview Data: ${JSON.stringify(params.interviewData, null, 2)}
Analysis Results: ${JSON.stringify(params.analysisResults, null, 2)}
User Profile: ${JSON.stringify(params.userProfile, null, 2)}

Generate detailed feedback including:
1. Overall performance rating (0-100)
2. Key strengths (3-5 points)
3. Areas for improvement (3-5 points)
4. Specific recommendations (3-5 actionable items)
5. Skill assessment for relevant skills
6. Next steps for improvement
7. Detailed narrative feedback

Return as JSON:
{
  "overallRating": 85,
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "improvements": ["improvement 1", "improvement 2", "improvement 3"],
  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"],
  "skillAssessment": [
    {
      "skill": "Communication",
      "currentLevel": 8,
      "targetLevel": 9,
      "feedback": "specific feedback"
    }
  ],
  "nextSteps": ["step 1", "step 2", "step 3"],
  "detailedFeedback": "comprehensive narrative feedback"
}
`;
  }

  private buildFollowUpPrompt(params: any): string {
    return `
Generate 2-3 relevant follow-up questions based on this interview exchange:

Original Question: "${params.originalQuestion}"
User Answer: "${params.userAnswer}"
Role: ${params.role}

The follow-up questions should:
1. Dig deeper into the candidate's response
2. Clarify any ambiguous points
3. Explore related technical or behavioral aspects
4. Be appropriate for the role and experience level

Return as JSON:
{
  "questions": ["follow-up question 1", "follow-up question 2", "follow-up question 3"]
}
`;
  }

  private buildResumeAnalysisPrompt(params: any): string {
    return `
Analyze this resume content and extract key information:

Resume Text: "${params.resumeText}"
${params.targetRole ? `Target Role: ${params.targetRole}` : ''}

Extract and analyze:
1. Skills (technical and soft skills)
2. Experience level (years)
3. Education background
4. Certifications
5. Key achievements
6. Industry experience
7. Leadership experience
8. Match score for target role (if provided)

Return as JSON:
{
  "skills": ["skill1", "skill2", "skill3"],
  "experience": 5,
  "education": [
    {
      "degree": "Bachelor's in Computer Science",
      "institution": "University Name",
      "year": 2020,
      "gpa": 3.8
    }
  ],
  "certifications": ["cert1", "cert2"],
  "achievements": ["achievement1", "achievement2"],
  "industries": ["industry1", "industry2"],
  "leadership": ["leadership experience"],
  "summary": "professional summary",
  "matchScore": 85,
  "recommendations": ["recommendation1", "recommendation2"]
}
`;
  }

  private buildRecommendationsPrompt(params: any): string {
    return `
Generate personalized improvement recommendations based on:

User Profile: ${JSON.stringify(params.userProfile, null, 2)}
Interview History: ${JSON.stringify(params.interviewHistory, null, 2)}
Current Performance: ${JSON.stringify(params.currentPerformance, null, 2)}

Generate recommendations in these categories:
1. Technical skills to develop
2. Behavioral interview preparation
3. Communication improvements
4. Industry-specific knowledge
5. Practice resources and methods

Prioritize recommendations based on:
- Current skill gaps
- Career goals
- Performance trends
- Industry requirements

Return as JSON:
{
  "recommendations": [
    {
      "category": "Technical Skills",
      "title": "recommendation title",
      "description": "detailed description",
      "priority": "high|medium|low",
      "timeframe": "1-2 weeks",
      "resources": ["resource1", "resource2"]
    }
  ],
  "learningPath": [
    {
      "step": 1,
      "title": "step title",
      "description": "step description",
      "duration": "2 weeks"
    }
  ],
  "practiceAreas": ["area1", "area2", "area3"]
}
`;
  }
}

export default new GeminiService();