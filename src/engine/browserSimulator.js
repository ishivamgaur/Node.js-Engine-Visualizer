export function generateBrowserTimeline(code) {
  const timeline = [];
  
  // Initial empty state
  let state = {
    dom: [],
    cssom: [],
    pipelinePhase: 'IDLE',
    consoleOutputs: [],
    htmlContent: code
  };

  const addStep = (actionName, details, highlight, line) => {
    timeline.push({
      action: actionName,
      details,
      highlight,
      line,
      state: JSON.parse(JSON.stringify(state))
    });
  };

  // Find basic elements in code using simple regex (mock parser)
  const hasStyle = code.includes('<style>');
  const styleMatch = code.match(/<style>([\s\S]*?)<\/style>/);
  const styleContent = styleMatch ? styleMatch[1].trim() : '';
  
  const hasBody = code.includes('<body>');
  const bodyMatch = code.match(/<body>([\s\S]*?)<\/body>/);
  const bodyContent = bodyMatch ? bodyMatch[1].trim() : '';
  
  const hasScript = code.includes('<script>');
  
  let nodeId = 1;

  addStep('START_REQUEST', 'Browser received HTML document', 'pipeline', 1);

  // 1. Parsing HTML
  state.pipelinePhase = 'PARSING_HTML';
  state.consoleOutputs.push('⬇️ Downloading HTML...');
  addStep('DOWNLOAD_HTML', 'Receiving bytes from network', 'pipeline', 1);
  
  state.consoleOutputs.push('🔍 Tokenizing HTML...');
  addStep('TOKENIZE', 'Converting bytes to characters to tokens', 'pipeline', 1);

  state.dom.push({ id: nodeId++, tag: 'html', children: [2, 3] });
  addStep('DOM_BUILD', 'Created <html> node', 'dom', 1);

  state.dom.push({ id: nodeId++, tag: 'head', parent: 1, children: [4] });
  addStep('DOM_BUILD', 'Created <head> node', 'dom', 2);

  if (hasStyle) {
    state.dom.push({ id: 4, tag: 'style', parent: 2, text: '...' });
    addStep('DOM_BUILD', 'Created <style> node', 'dom', 3);

    // 2. Parsing CSS
    state.pipelinePhase = 'PARSING_CSS';
    state.consoleOutputs.push('🎨 Parsing CSS styling rules...');
    addStep('CSS_PARSE', 'Browser found <style> or <link rel="stylesheet">', 'pipeline', 3);
    
    // Extract CSS rules (mock)
    const cssRules = styleContent.split('}').filter(r => r.trim());
    cssRules.forEach((rule, idx) => {
      const [selector, rulesText] = rule.split('{');
      if (selector && rulesText) {
        const rules = {};
        rulesText.split(';').forEach(r => {
          const [k, v] = r.split(':');
          if (k && v) rules[k.trim()] = v.trim();
        });
        state.cssom.push({ selector: selector.trim(), rules });
        addStep('CSSOM_BUILD', `Created CSSOM node for ${selector.trim()}`, 'cssom', 4 + idx);
      }
    });
  }

  // Back to DOM
  state.pipelinePhase = 'PARSING_HTML';
  state.dom.push({ id: 3, tag: 'body', parent: 1, children: [] });
  addStep('DOM_BUILD', 'Created <body> node', 'dom', 6);

  if (hasBody) {
    // Extract generic tags for mock (h1, p, div, button, etc.)
    const tagRegex = /<([a-z1-6]+)(?:\s+class="([^"]+)")?>([^<]*)/g;
    let match;
    let i = 0;
    while ((match = tagRegex.exec(bodyContent)) !== null) {
      if (match[1] === 'script') continue;
      const tag = match[1];
      const cls = match[2];
      const text = match[3] ? match[3].trim() : '';
      const classes = cls ? cls.split(' ') : [];
      state.dom.push({ id: 10 + i, tag, classes, text, parent: 3 });
      addStep('DOM_BUILD', `Created <${tag}${cls ? ` class="${cls}"` : ''}> node`, 'dom', 7 + i);
      i++;
    }
  }
  
  if (hasScript) {
    state.consoleOutputs.push('JS Evaluated: DOM is fully parsed!');
    addStep('JS_EVAL', 'Executed <script> tag blocking parsing', 'pipeline', 9);
  }

  state.consoleOutputs.push('✅ DOM Content Loaded');
  addStep('DOM_COMPLETE', 'HTML parsing finished', 'pipeline', 10);

  // 3. Render Tree (Attachment)
  state.pipelinePhase = 'STYLE_CALCULATION';
  state.consoleOutputs.push('🔄 Recalculating Styles (Attachment)...');
  addStep('STYLE_CALCULATION', 'Matching DOM nodes to CSSOM rules', 'pipeline', null);

  // 4. Layout
  state.pipelinePhase = 'LAYOUT';
  state.consoleOutputs.push('📐 Layout / Reflow...');
  addStep('LAYOUT', 'Calculating geometry: Elements positioned on screen', 'pipeline', null);

  // 5. Paint
  state.pipelinePhase = 'PAINT';
  state.consoleOutputs.push('🖌️ Painting pixels...');
  addStep('PAINT', 'Rasterizing text, colors, and borders', 'pipeline', null);

  // 6. Composite
  state.pipelinePhase = 'COMPOSITE';
  state.consoleOutputs.push('🖼️ Compositing layers...');
  addStep('COMPOSITE', 'Sending layers to GPU to display on screen', 'pipeline', null);
  
  state.pipelinePhase = 'FINISHED';
  state.consoleOutputs.push('✨ Frame rendered on screen!');
  addStep('FRAME_COMPLETE', 'Render pipeline finished', 'pipeline', null);

  return timeline;
}
