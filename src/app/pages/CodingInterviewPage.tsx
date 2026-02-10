import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { Play, Lightbulb, Clock, CheckCircle, Code, Terminal, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';

const CODE_TEMPLATES = {
  javascript: `function twoSum(nums, target) {
  // Write your solution here
  
}`,
  python: `def two_sum(nums, target):
    # Write your solution here
    pass`,
  java: `class Solution {
    public int[] twoSum(int[] nums, int target) {
        // Write your solution here
        
    }
}`,
  cpp: `class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        // Write your solution here
        
    }
};`
};

export function CodingInterviewPage() {
  const navigate = useNavigate();
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState(CODE_TEMPLATES.javascript);
  const [output, setOutput] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [testsPassed, setTestsPassed] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionTime, setExecutionTime] = useState<number | null>(null);

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    setCode(CODE_TEMPLATES[newLanguage as keyof typeof CODE_TEMPLATES]);
  };

  const problem = {
    title: "Two Sum",
    difficulty: "Easy",
    description: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice.",
    examples: [
      {
        input: "nums = [2,7,11,15], target = 9",
        output: "[0,1]",
        explanation: "Because nums[0] + nums[1] == 9, we return [0, 1]."
      },
      {
        input: "nums = [3,2,4], target = 6",
        output: "[1,2]"
      }
    ],
    constraints: [
      "2 <= nums.length <= 10⁴",
      "-10⁹ <= nums[i] <= 10⁹",
      "-10⁹ <= target <= 10⁹",
      "Only one valid answer exists."
    ],
    hints: [
      "Use a hash map to store the numbers you've seen",
      "For each number, check if target - number exists in the hash map",
      "Time complexity should be O(n)"
    ],
    testCases: [
      { input: '[2,7,11,15]\n9', expectedOutput: '[0,1]' },
      { input: '[3,2,4]\n6', expectedOutput: '[1,2]' },
      { input: '[3,3]\n6', expectedOutput: '[0,1]' },
    ]
  };

  const handleRunCode = async () => {
    setOutput('Running tests...\n');
    setIsExecuting(true);
    setExecutionTime(null);

    try {
      const response = await apiService.post('/api/code/execute-tests', {
        language,
        code,
        testCases: problem.testCases || [
          { input: '[2,7,11,15]\n9', expectedOutput: '[0,1]' },
          { input: '[3,2,4]\n6', expectedOutput: '[1,2]' },
          { input: '[3,3]\n6', expectedOutput: '[0,1]' },
        ],
      });

      if (response.success && response.data) {
        const { testResults, executionTime: execTime } = response.data;
        
        setExecutionTime(execTime);
        
        let outputText = '';
        let passed = 0;

        testResults.forEach((result: any, index: number) => {
          const status = result.passed ? '✓' : '✗';
          const statusText = result.passed ? 'Passed' : 'Failed';
          
          outputText += `Test Case ${index + 1}: ${status} ${statusText}\n`;
          outputText += `Input: ${result.input}\n`;
          outputText += `Expected: ${result.expectedOutput}\n`;
          outputText += `Got: ${result.actualOutput}\n`;
          
          if (result.executionTime) {
            outputText += `Time: ${result.executionTime}ms\n`;
          }
          
          outputText += '\n';
          
          if (result.passed) passed++;
        });

        setTestsPassed(passed);
        outputText += `${passed}/${testResults.length} tests passed\n`;
        
        if (passed === testResults.length) {
          outputText += '\n✓ All tests passed! Great work!';
          toast.success('All tests passed!');
        } else {
          outputText += '\n⚠ Some tests failed. Keep trying!';
          toast.error('Some tests failed');
        }

        setOutput(outputText);
      } else {
        setOutput(`Error: ${response.error || 'Code execution failed'}`);
        toast.error('Code execution failed');
      }
    } catch (error: any) {
      console.error('Code execution error:', error);
      setOutput(`Error: ${error.message || 'Failed to execute code'}`);
      toast.error('Failed to execute code');
    } finally {
      setIsExecuting(false);
    }
  };

  const handleSubmit = () => {
    navigate('/feedback/1');
  };

  return (
    <div className="min-h-screen py-20 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Top Bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="px-4 py-2 bg-secondary rounded-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              <span>45:00</span>
            </div>
            <div className="px-4 py-2 bg-green-500/20 border-2 border-green-500 rounded-lg flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="text-green-400">{testsPassed}/3 Tests Passed</span>
            </div>
          </div>
          <Button variant="gradient" onClick={handleSubmit} glow>
            Submit Solution
          </Button>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Panel - Problem Description */}
          <div className="space-y-6">
            <Card glow>
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl gradient-text">{problem.title}</h1>
                <span className={`px-3 py-1 rounded-full text-sm ${
                  problem.difficulty === 'Easy' ? 'bg-green-500/20 text-green-400' :
                  problem.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  {problem.difficulty}
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg mb-2">Description</h3>
                  <p className="text-muted-foreground">{problem.description}</p>
                </div>

                <div>
                  <h3 className="text-lg mb-2">Examples</h3>
                  <div className="space-y-3">
                    {problem.examples.map((example, index) => (
                      <div key={index} className="bg-secondary rounded-lg p-4">
                        <p className="text-sm mb-1">
                          <span className="text-muted-foreground">Input:</span> {example.input}
                        </p>
                        <p className="text-sm mb-1">
                          <span className="text-muted-foreground">Output:</span> {example.output}
                        </p>
                        {example.explanation && (
                          <p className="text-sm text-muted-foreground mt-2">
                            Explanation: {example.explanation}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg mb-2">Constraints</h3>
                  <ul className="space-y-1">
                    {problem.constraints.map((constraint, index) => (
                      <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full mt-1.5 shrink-0"></div>
                        {constraint}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>

            {/* AI Hints */}
            <Card>
              <button
                onClick={() => setShowHint(!showHint)}
                className="flex items-center justify-between w-full"
              >
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-yellow-400" />
                  <h3 className="text-lg">AI Hints</h3>
                </div>
                <span className="text-sm text-muted-foreground">
                  {showHint ? 'Hide' : 'Show'} hints
                </span>
              </button>
              
              {showHint && (
                <div className="mt-4 space-y-2">
                  {problem.hints.map((hint, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <div className="w-6 h-6 bg-yellow-500/20 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-yellow-400 text-xs">{index + 1}</span>
                      </div>
                      <p>{hint}</p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Right Panel - Code Editor */}
          <div className="space-y-6">
            <Card glow>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Code className="w-5 h-5 text-primary" />
                  <h3 className="text-lg">Code Editor</h3>
                </div>
                <div className="flex items-center gap-2">
                  <select 
                    className="px-3 py-1.5 bg-secondary border border-border rounded-lg text-sm"
                    value={language}
                    onChange={(e) => handleLanguageChange(e.target.value)}
                  >
                    <option value="javascript">JavaScript</option>
                    <option value="python">Python</option>
                    <option value="java">Java</option>
                    <option value="cpp">C++</option>
                  </select>
                </div>
              </div>

              <div className="border border-border rounded-lg overflow-hidden">
                <Editor
                  height="400px"
                  language={language}
                  value={code}
                  onChange={(value) => setCode(value || '')}
                  theme="vs-dark"
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
                    wordWrap: 'on',
                    automaticLayout: true,
                  }}
                />
              </div>

              <Button variant="gradient" onClick={handleRunCode} className="w-full mt-4" glow disabled={isExecuting}>
                {isExecuting ? (
                  <>
                    <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                    Executing...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 w-4 h-4" />
                    Run Code
                  </>
                )}
              </Button>
              
              {executionTime !== null && (
                <div className="mt-2 text-xs text-center text-muted-foreground">
                  Execution time: {executionTime}ms
                </div>
              )}
            </Card>

            {/* Output Console */}
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <Terminal className="w-5 h-5 text-primary" />
                <h3 className="text-lg">Output</h3>
              </div>
              <div className="bg-[#1e1e1e] rounded-lg p-4 h-64 overflow-y-auto font-mono text-sm">
                {output || (
                  <p className="text-gray-500">Click "Run Code" to see output...</p>
                )}
                <pre className="text-gray-300 whitespace-pre-wrap">{output}</pre>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
