import type { FullResult, Reporter, Suite, TestCase, TestResult } from '@playwright/test/reporter';

import { existsSync, readFileSync, writeFileSync } from 'fs';

class CustomReporter implements Reporter {
  testResultPath = 'test-result.json';
  allTestResults = [];

  onTestEnd(test: TestCase, result: TestResult) {
    if (result.status !== 'skipped') {
      const data = {
        id: test.id,
        className: this.getFullTestName(test),
        methodName: this.getFullTestName(test),
        displayName: test.title,
        labels: test.annotations
          ? test.annotations
              ?.filter((annotation) => annotation.type === 'Requirement')
              .map((t) => ({
                name: 'tag',
                value: t.description,
              }))
          : [],
        startTime: result.startTime.valueOf(),
        endTime: result.startTime.valueOf() + result.duration,
        status: result.status === 'passed' ? 'SUCCESSFUL' : 'FAILED',
        environment: this.getEnvironment(test.parent),
      };

      this.allTestResults.push(data);
    }
  }

  onEnd(result: FullResult) {
    if (!existsSync(this.testResultPath)) {
      writeFileSync(this.testResultPath, JSON.stringify(this.allTestResults));
      return;
    }

    const previousContent = JSON.parse(readFileSync(this.testResultPath, 'utf8'));
    const newFileContent = this.mergeResults(previousContent, this.allTestResults);
    writeFileSync(this.testResultPath, JSON.stringify(newFileContent));
  }

  mergeResults(
    previousTestResults: CustomTestResult[],
    newTestResults: CustomTestResult[],
  ): CustomTestResult[] {
    // The class name is considered unique, because it contains the test name as well as the test hierarchy
    return previousTestResults
      .filter(
        (stat) =>
          !newTestResults.some((s) => s.className === stat.className && s.status !== 'skipped'),
      )
      .concat(newTestResults.filter((stat) => stat.status !== 'skipped'));
  }

  getFullTestName(test: TestCase): string {
    if (test.parent) {
      return this.getFullTestSuiteName(test.parent) + ' ' + test.title;
    }
    return test.title;
  }

  getFullTestSuiteName(suite: Suite): string {
    // ignore the top 2 suite because these are the environment and the suite file name
    if (suite.parent?.parent?.parent?.parent) {
      return this.getFullTestSuiteName(suite.parent) + ' ' + suite.title;
    }
    return suite.title;
  }

  getEnvironment(suite: Suite): string {
    // in the test result hierarchies there is the environment contained in the second level
    if (suite.parent?.parent === undefined) {
      return suite.title;
    } else {
      return this.getEnvironment(suite.parent);
    }
  }
}

interface CustomTestResult {
  id: string;
  className: string;
  methodName: string;
  displayName: string;
  labels: CustomTestResultLabel[];
  startTime: string | null;
  endTime: string | null;
  status: string;
  environment: string;
}

interface CustomTestResultLabel {
  name: string;
  value: string;
}

export default CustomReporter;
