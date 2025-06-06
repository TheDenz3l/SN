#!/bin/bash
echo "Execution test successful" > execution-test-result.txt
echo "Current directory: $(pwd)" >> execution-test-result.txt
echo "Node version: $(node --version)" >> execution-test-result.txt 2>/dev/null || echo "Node not found" >> execution-test-result.txt
echo "Test completed at: $(date)" >> execution-test-result.txt
