document.addEventListener('DOMContentLoaded', () => {

     chrome.storage.local.get(['researchNotes'], function(result) {
          if (result.researchNotes) {
               document.getElementById('notes').value = result.researchNotes;
          }
     });

     document.getElementById('summarizeBtn').addEventListener('click', summarizeText);
     document.getElementById('saveNotesBtn').addEventListener('click', saveNotes);
});

async function summarizeText() {
     try {
          let selectedText = '';

          // First try to get selected text from the webpage
          try {
               const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

               if (tab && tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('chrome-extension://')) {
                    const [{ result }] = await chrome.scripting.executeScript({
                         target: { tabId: tab.id },
                         function: () => window.getSelection().toString()
                    });
                    selectedText = result || '';
               }
          } catch (e) {
               // script injection failed, will fallback to notes
          }

          // Fallback to notes textarea if no text selected
          if (!selectedText || selectedText.trim() === '') {
               selectedText = document.getElementById('notes').value.trim();
          }

          // Nothing to summarize
          if (!selectedText) {
               showResult('Please select text on a webpage OR paste text in the Notes area below.');
               return;
          }

          showResult('Summarizing...');

          const response = await fetch('http://localhost:8080/api/research/process', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({ content: selectedText, operation: 'summarize' })
          });

          if (!response.ok) {
               throw new Error(`API Error: ${response.status}`);
          }

          const text = await response.text();
          showResult(text.replace(/\n/g, '<br>'));

     } catch (error) {
          showResult('Error: ' + error.message);
     }
}

async function saveNotes() {
     const notes = document.getElementById('notes').value;
     chrome.storage.local.set({ 'researchNotes': notes }, function () {
          alert('Notes saved successfully');
     });
}

function showResult(content) {
     document.getElementById('results').innerHTML = `
          <div class="result-item">
               <div class="result-content">${content}</div>
          </div>`;
}