(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();function e(e,t){let n=document.getElementById(`status`);n&&(n.textContent=e,n.style.background=t===`error`?`#f44336`:`#4CAF50`,n.classList.add(`show`),setTimeout(()=>{n.classList.remove(`show`)},3e3))}function t(e,t,n){let r=document.getElementById(e),i=document.getElementById(t);!r||!i||(i.innerHTML=`<p style="text-align: center; color: #666;">⏳ ${n}</p>`,r.classList.add(`show`))}function n(e){document.getElementById(e)?.classList.remove(`show`)}function r(e){let t=document.createElement(`div`);return t.textContent=e,t.innerHTML}function i(e,t){let n=new Blob([e],{type:`text/plain`}),r=URL.createObjectURL(n),i=document.createElement(`a`);i.href=r,i.download=t,document.body.appendChild(i),i.click(),document.body.removeChild(i),URL.revokeObjectURL(r)}var a=`/api`;async function o(e,t){let n=await fetch(`${a}${e}`,{headers:{"Content-Type":`application/json`},...t}),r=await n.json();if(!n.ok)throw Error(r.error||`Request failed: ${n.status}`);return r}async function s(e,t){return o(e,{method:`POST`,body:JSON.stringify(t)})}async function c(e){return o(e,{method:`DELETE`})}var l=null;function u(){return l}function d(e){l=e}async function f(){try{let e=await o(`/sessions`),t=document.getElementById(`sessionSelector`);if(!t)return;t.innerHTML=`<option value="">No Session (In-Memory Only)</option>`,e.forEach(e=>{let n=document.createElement(`option`);n.value=e.id,n.textContent=`${e.title} (${e.operationCount} ops)`,t.appendChild(n)});let n=u();n&&(t.value=n)}catch(e){console.error(`Failed to load sessions:`,e)}}async function p(){let t=prompt(`Enter session title:`);if(!t)return;let n=prompt(`Enter session description (optional):`)??void 0;try{d((await s(`/sessions`,{title:t,description:n||void 0})).id),await f();let r=window;typeof r.refreshHistory==`function`&&await r.refreshHistory(),e(`Session "${t}" created!`,`success`)}catch(t){e(`Failed to create session: ${t.message}`,`error`)}}async function m(){let t=document.getElementById(`sessionSelector`);if(!t)return;d(t.value||null),u()?e(`Switched to session`,`success`):e(`Using in-memory mode (no persistence)`,`success`);let n=window;typeof n.refreshHistory==`function`&&await n.refreshHistory()}async function ee(){await f(),alert(`Session management: Use the dropdown to switch sessions. To delete a session, please use the API directly for now.`)}async function h(){try{let e=u();if(e){let t=await o(`/sessions/${e}/history`);g(t),_(t.length)}else{let e=await o(`/history`);g(e.history),_(e.count)}}catch(t){e(`Failed to load history: ${t.message}`,`error`)}}function g(e){let t=document.getElementById(`historyList`);if(t){if(!e||e.length===0){t.innerHTML=`<div class="history-empty">No operations yet. Start editing to see history here.</div>`;return}t.innerHTML=[...e].reverse().map(e=>{let t=new Date(e.timestamp).toLocaleTimeString(),n=e.resultText.substring(0,60);return`
      <div class="history-item">
        <div class="history-item-info">
          <div class="history-operation">${e.type.toUpperCase()}</div>
          <div class="history-timestamp">${t}</div>
          <div class="history-preview">${n}${e.resultText.length>60?`...`:``}</div>
        </div>
        <div class="history-actions">
          <button data-action="viewHistoryItem" data-id="${e.id}">👁️</button>
          <button data-action="deleteHistoryItem" data-id="${e.id}">🗑️</button>
        </div>
      </div>
    `}).join(``)}}function _(e){let t=document.getElementById(`historyCount`);t&&(t.textContent=`${e} ${e===1?`operation`:`operations`}`)}async function v(t){try{let n=(await o(`/history/${t}`)).operation,r=document.getElementById(`result`),i=document.getElementById(`resultTitle`),a=document.getElementById(`resultText`);i&&(i.textContent=`${n.type.toUpperCase()} Result (${new Date(n.timestamp).toLocaleTimeString()})`),a&&(a.textContent=n.resultText),r?.classList.remove(`error`),r?.classList.add(`show`),e(`Viewing history item`,`success`)}catch(t){e(`Failed to view history item: ${t.message}`,`error`)}}async function te(t){if(confirm(`Delete this history item?`))try{await c(`/history/${t}`),await h(),e(`History item deleted`,`success`)}catch(t){e(`Failed to delete: ${t.message}`,`error`)}}async function ne(){try{let t=await fetch(`/api/history/export/json`);if(!t.ok)throw Error(`Failed to export history`);i(await t.text(),`history-${new Date().toISOString().slice(0,10)}.json`),e(`History exported successfully!`,`success`)}catch(t){e(`Failed to export: ${t.message}`,`error`)}}function re(){confirm(`This will delete ALL history. Are you sure?`)&&ie()}async function ie(){try{await c(`/history`),await h(),e(`All history cleared`,`success`)}catch(t){e(`Failed to clear history: ${t.message}`,`error`)}}var ae={text:`txt`,markdown:`md`,json:`json`};function oe(e){return ae[e]??e}async function se(t){let n=document.getElementById(`text`),r=document.getElementById(`synopsis`),a=n?.value??``,o=r?.value??``;if(!a.trim()){e(`Please enter some text first`,`error`);return}try{i((await s(`/export/${t}`,{text:a,synopsis:o||void 0})).content,`story-export.${oe(t)}`),e(`Exported as ${t} successfully!`,`success`)}catch(t){e(`Export failed: ${t.message}`,`error`)}}var y={lineView:!1};async function b(t,n){try{let[e,r]=await Promise.all([s(`/diff/stats`,{original:t,modified:n}),s(`/diff/lines`,{original:t,modified:n})]);x(t,n,e.stats,r.changes)}catch(t){e(`Failed to compute diff: ${t.message}`,`error`)}}function x(e,t,n,r){let i=document.getElementById(`diffSection`),a=document.getElementById(`diffAdded`),o=document.getElementById(`diffRemoved`),s=document.getElementById(`diffSimilarity`);a&&(a.textContent=String(n.additions)),o&&(o.textContent=String(n.deletions)),s&&(s.textContent=`${((1-Math.abs(n.charDelta)/Math.max(e.length,t.length))*100).toFixed(0)}%`),y.lineView?S(r):C(e,t),i?.classList.add(`show`)}function S(e){let t=document.getElementById(`diffOriginal`),n=document.getElementById(`diffModified`);if(!t||!n)return;let i=[],a=[],o=1,s=1;e.forEach(e=>{let t=e.content??e.value??``;e.type===`equal`?(i.push({number:o,content:t,type:`equal`}),a.push({number:s,content:t,type:`equal`}),o++,s++):e.type===`remove`?(i.push({number:o,content:t,type:`removed`}),o++):e.type===`add`&&(a.push({number:s,content:t,type:`added`}),s++)});let c=e=>e.map(e=>`
      <div class="diff-line ${e.type}">
        <span class="diff-line-number">${e.number}</span>
        <span class="diff-line-content">${r(e.content)}</span>
      </div>
    `).join(``);t.innerHTML=c(i),n.innerHTML=c(a)}function C(e,t){let n=document.getElementById(`diffOriginal`),i=document.getElementById(`diffModified`);!n||!i||(n.innerHTML=`<pre style="margin: 0; padding: 8px; background: white;">${r(e)}</pre>`,i.innerHTML=`<pre style="margin: 0; padding: 8px; background: white;">${r(t)}</pre>`)}function w(){y.lineView=!y.lineView;let e=document.getElementById(`text`),t=document.getElementById(`resultText`),n=e?.value??``,r=t?.textContent??``;r&&n&&b(n,r)}async function T(t){let n=document.getElementById(`text`),r=document.getElementById(`synopsis`),i=n?.value??``,a=r?.value??``;if(!i.trim()){e(`Please enter some text first`,`error`);return}let o=document.getElementById(`result`),c=document.getElementById(`loading`),l=document.getElementById(`resultTitle`),d=document.getElementById(`resultText`);c?.classList.add(`show`),o?.classList.remove(`show`);try{let r=await s(`/text/${t}`,{text:i,synopsis:a||void 0});l&&(l.textContent=`${t.charAt(0).toUpperCase()+t.slice(1)} Result:`),d&&(d.textContent=r.result),o?.classList.remove(`error`),o?.classList.add(`show`),await b(i,r.result),n&&(n.value=r.result),await D(r.result);let c=u();if(c)try{await s(`/sessions/${c}/history`,{type:t,originalText:i,resultText:r.result,synopsis:a||void 0}),await f()}catch(e){console.error(`Failed to save to session:`,e)}e(`${t} complete! Text and synopsis updated. Check diff for changes.`,`success`)}catch(t){l&&(l.textContent=`Error:`),d&&(d.textContent=t.message),o?.classList.add(`error`),o?.classList.add(`show`),e(`Operation failed`,`error`)}finally{c?.classList.remove(`show`)}}async function E(){let t=document.getElementById(`text`)?.value??``;if(!t.trim()){e(`Please enter some text first`,`error`);return}let n=document.getElementById(`result`),r=document.getElementById(`loading`),i=document.getElementById(`resultTitle`),a=document.getElementById(`resultText`);r?.classList.add(`show`),n?.classList.remove(`show`);try{let r=await s(`/text/synopsis`,{text:t});i&&(i.textContent=`Generated Synopsis:`),a&&(a.textContent=r.synopsis);let o=document.getElementById(`synopsis`);o&&(o.value=r.synopsis),n?.classList.remove(`error`),n?.classList.add(`show`),e(`Synopsis generated and copied to context field!`,`success`)}catch(t){i&&(i.textContent=`Error:`),a&&(a.textContent=t.message),n?.classList.add(`error`),n?.classList.add(`show`),e(`Synopsis generation failed`,`error`)}finally{r?.classList.remove(`show`)}}async function D(e){try{let t=await s(`/text/synopsis`,{text:e}),n=document.getElementById(`synopsis`);n&&(n.value=t.synopsis)}catch(e){console.warn(`Auto-synopsis generation failed:`,e)}}function O(e){return e>.6?`positive`:e<.4?`negative`:`neutral`}async function k(){let r=document.getElementById(`text`)?.value??``;if(!r.trim()){e(`Please enter some text first`,`error`);return}t(`toneResults`,`toneContent`,`Analyzing emotional tone...`);try{M(await s(`/analysis/tone`,{text:r,granularity:`paragraph`})),e(`Tone analysis complete!`,`success`)}catch(t){e(`Tone analysis failed: ${t.message}`,`error`),n(`toneResults`)}}async function A(){let r=document.getElementById(`text`),i=document.getElementById(`resultText`),a=r?.value??``,o=i?.textContent??``;if(!a.trim()||!o.trim()){e(`Please perform a text operation first to have two versions to compare`,`error`);return}t(`toneResults`,`toneContent`,`Comparing tone...`);try{N(await s(`/analysis/compare`,{original:a,revised:o})),e(`Tone comparison complete!`,`success`)}catch(t){e(`Tone comparison failed: ${t.message}`,`error`),n(`toneResults`)}}async function j(){let r=document.getElementById(`text`)?.value??``;if(!r.trim()){e(`Please enter some text first`,`error`);return}t(`toneResults`,`toneContent`,`Computing emotional arc...`);try{let t=await s(`/analysis/tone`,{text:r,granularity:`paragraph`}),n=t.segments??t.sections??[];P(await s(`/analysis/arc`,{sentiments:n.map(e=>e.sentiment)}),n),e(`Emotional arc computed!`,`success`)}catch(t){e(`Emotional arc failed: ${t.message}`,`error`),n(`toneResults`)}}function M(e){let t=document.getElementById(`toneContent`);if(!t)return;let n=e.segments??e.sections??[];t.innerHTML=`
    <h4>Overall Tone: ${e.overallTone??`N/A`}</h4>
    <p><strong>Dominant Emotion:</strong> ${e.dominantEmotion??`N/A`} (${Math.round((e.averageSentiment??0)*100)}%)</p>
    <div class="tone-segments">
      <h5>Segments:</h5>
      ${n.map((e,t)=>`
        <div class="tone-segment">
          <strong>Segment ${t+1}</strong>
          <span class="tone-value tone-${O(e.sentiment)}">${Math.round(e.sentiment*100)}%</span>
          <div style="margin-top: 4px; font-size: 12px; color: #666;">${e.text.substring(0,100)}...</div>
        </div>
      `).join(``)}
    </div>
  `,document.getElementById(`toneResults`)?.classList.add(`show`)}function N(e){let t=document.getElementById(`toneContent`);if(!t)return;let n=e.sentimentChange??e.sentiment_shift??0,r=e.originalTone??e.original_tone?.tone??`N/A`,i=e.revisedTone??e.revised_tone?.tone??`N/A`,a=e.interpretation??`Tone shift detected`;t.innerHTML=`
    <h4>Tone Comparison</h4>
    <div class="metric">
      <span>Sentiment Change:</span>
      <span class="tone-value tone-${n>0?`positive`:n<0?`negative`:`neutral`}">
        ${n>0?`+`:``}${Math.round(n*100)}%
      </span>
    </div>
    <div class="metric"><span>Original Tone:</span> <strong>${r}</strong></div>
    <div class="metric"><span>Revised Tone:</span> <strong>${i}</strong></div>
    <p style="margin-top: 10px;"><strong>Analysis:</strong> ${a}</p>
  `,document.getElementById(`toneResults`)?.classList.add(`show`)}function P(e,t){let n=document.getElementById(`toneContent`);n&&(n.innerHTML=`
    <h4>Emotional Arc</h4>
    <div class="metric"><span>Arc Type:</span> <strong>${e.arcType??e.overall_trajectory??`N/A`}</strong></div>
    <div class="metric"><span>Volatility:</span> <strong>${Math.round((e.volatility??0)*100)}%</strong></div>
    <div class="metric"><span>Trend:</span> <strong>${e.trend??`N/A`}</strong></div>
    <div style="margin-top: 15px;">
      <h5>Emotional Journey:</h5>
      ${t.map((e,t)=>`
        <div class="tone-segment">
          <strong>Point ${t+1}</strong>
          <span class="tone-value tone-${O(e.sentiment)}">${Math.round(e.sentiment*100)}%</span>
        </div>
      `).join(``)}
    </div>
  `,document.getElementById(`toneResults`)?.classList.add(`show`))}async function F(){let r=document.getElementById(`text`)?.value??``;if(!r.trim()){e(`Please enter some text first`,`error`);return}t(`entityResults`,`entityContent`,`Extracting entities...`);try{R(await s(`/entities/extract`,{text:r,options:{includeRelationships:!0}})),e(`Entities extracted!`,`success`)}catch(t){e(`Entity extraction failed: ${t.message}`,`error`),n(`entityResults`)}}async function I(){let r=document.getElementById(`text`)?.value??``;if(!r.trim()){e(`Please enter some text first`,`error`);return}t(`entityResults`,`entityContent`,`Generating entity summary...`);try{z(await s(`/entities/summary`,{text:r})),e(`Entity summary generated!`,`success`)}catch(t){e(`Entity summary failed: ${t.message}`,`error`),n(`entityResults`)}}async function L(){let r=document.getElementById(`text`),i=document.getElementById(`resultText`),a=r?.value??``,o=i?.textContent??``;if(!a.trim()||!o.trim()){e(`Please perform a text operation first to have two versions to compare`,`error`);return}t(`entityResults`,`entityContent`,`Comparing entities...`);try{B(await s(`/entities/compare`,{original:a,revised:o})),e(`Entity comparison complete!`,`success`)}catch(t){e(`Entity comparison failed: ${t.message}`,`error`),n(`entityResults`)}}function R(e){let t=document.getElementById(`entityContent`);if(!t)return;let n=e=>e.map(e=>`
      <div class="entity-item">
        <div class="entity-name">${e.name}</div>
        <div class="entity-details">
          Mentions: ${e.mentions} |
          First: Para ${e.firstAppearance.paragraph}, Sent ${e.firstAppearance.sentence}
          ${e.attributes.length>0?`<br>Attributes: ${e.attributes.join(`, `)}`:``}
          ${e.relationships&&e.relationships.length>0?`<br>Relations: ${e.relationships.map(e=>`${e.target} (${e.type})`).join(`, `)}`:``}
        </div>
      </div>
    `).join(``)||`<p style="color: #999;">None found</p>`;t.innerHTML=`
    <h4>Extracted Entities (${e.entityCount} total)</h4>
    <div style="margin-top: 15px;">
      <h5>👥 Characters (${e.characters.length})</h5>
      <div class="entity-list">${n(e.characters)}</div>
    </div>
    <div style="margin-top: 15px;">
      <h5>📍 Locations (${e.locations.length})</h5>
      <div class="entity-list">${n(e.locations)}</div>
    </div>
    <div style="margin-top: 15px;">
      <h5>🔧 Objects (${e.objects.length})</h5>
      <div class="entity-list">${n(e.objects)}</div>
    </div>
  `,document.getElementById(`entityResults`)?.classList.add(`show`)}function z(e){let t=document.getElementById(`entityContent`);t&&(t.innerHTML=`
    <h4>Entity Summary</h4>
    <div class="metric"><span>Characters:</span> <strong>${e.characterCount}</strong></div>
    <div class="metric"><span>Locations:</span> <strong>${e.locationCount}</strong></div>
    <div class="metric"><span>Objects:</span> <strong>${e.objectCount}</strong></div>
    <div class="metric"><span>Total Mentions:</span> <strong>${e.totalMentions}</strong></div>
    <div class="metric">
      <span>Most Mentioned:</span>
      <strong>${e.mostMentioned.name} (${e.mostMentioned.type}, ${e.mostMentioned.mentions} mentions)</strong>
    </div>
  `,document.getElementById(`entityResults`)?.classList.add(`show`))}function B(e){let t=document.getElementById(`entityContent`);t&&(t.innerHTML=`
    <h4>Entity Comparison</h4>
    <div style="margin-top: 15px;">
      <h5 style="color: #4CAF50;">➕ Added Entities</h5>
      <p><strong>Characters:</strong> ${e.added.characters.join(`, `)||`None`}</p>
      <p><strong>Locations:</strong> ${e.added.locations.join(`, `)||`None`}</p>
      <p><strong>Objects:</strong> ${e.added.objects.join(`, `)||`None`}</p>
    </div>
    <div style="margin-top: 15px;">
      <h5 style="color: #f44336;">➖ Removed Entities</h5>
      <p><strong>Characters:</strong> ${e.removed.characters.join(`, `)||`None`}</p>
      <p><strong>Locations:</strong> ${e.removed.locations.join(`, `)||`None`}</p>
      <p><strong>Objects:</strong> ${e.removed.objects.join(`, `)||`None`}</p>
    </div>
    <div style="margin-top: 15px;">
      <h5 style="color: #2196F3;">✓ Retained Entities</h5>
      <p><strong>Characters:</strong> ${e.retained.characters.join(`, `)||`None`}</p>
      <p><strong>Locations:</strong> ${e.retained.locations.join(`, `)||`None`}</p>
      <p><strong>Objects:</strong> ${e.retained.objects.join(`, `)||`None`}</p>
    </div>
  `,document.getElementById(`entityResults`)?.classList.add(`show`))}function V(e){return{linear:`Events unfold chronologically from beginning to end.`,"non-linear":`Timeline includes flashbacks, flash-forwards, or parallel narratives.`,circular:`Narrative ends where it began, creating a cyclical structure.`,fragmented:`Story told in disconnected pieces or vignettes.`}[e]??`Structure pattern identified in the narrative.`}async function H(){let r=document.getElementById(`text`)?.value??``;if(!r.trim()){e(`Please enter some text first`,`error`);return}t(`timelineResults`,`timelineContent`,`Extracting events...`);try{q((await s(`/timeline/events`,{text:r})).events),e(`Events extracted!`,`success`)}catch(t){e(`Event extraction failed: ${t.message}`,`error`),n(`timelineResults`)}}async function U(){let r=document.getElementById(`text`)?.value??``;if(!r.trim()){e(`Please enter some text first`,`error`);return}t(`timelineResults`,`timelineContent`,`Building timeline...`);try{ce(await s(`/timeline/build`,{text:r})),e(`Timeline built!`,`success`)}catch(t){e(`Timeline build failed: ${t.message}`,`error`),n(`timelineResults`)}}async function W(){let r=document.getElementById(`text`)?.value??``;if(!r.trim()){e(`Please enter some text first`,`error`);return}t(`timelineResults`,`timelineContent`,`Analyzing pacing...`);try{le(await s(`/timeline/pacing`,{text:r})),e(`Pacing analyzed!`,`success`)}catch(t){e(`Pacing analysis failed: ${t.message}`,`error`),n(`timelineResults`)}}async function G(){let r=document.getElementById(`text`)?.value??``;if(!r.trim()){e(`Please enter some text first`,`error`);return}t(`timelineResults`,`timelineContent`,`Detecting narrative structure...`);try{ue((await s(`/timeline/structure`,{text:r})).structure),e(`Narrative structure detected!`,`success`)}catch(t){e(`Structure detection failed: ${t.message}`,`error`),n(`timelineResults`)}}async function K(){let r=document.getElementById(`text`),i=document.getElementById(`resultText`),a=r?.value??``,o=i?.textContent??``;if(!a.trim()||!o.trim()){e(`Please perform a text operation first to have two versions to compare`,`error`);return}t(`timelineResults`,`timelineContent`,`Comparing timelines...`);try{de(await s(`/timeline/compare`,{original:a,revised:o})),e(`Timeline comparison complete!`,`success`)}catch(t){e(`Timeline comparison failed: ${t.message}`,`error`),n(`timelineResults`)}}function q(e){let t=document.getElementById(`timelineContent`),n=`
    <h4>Extracted Events (${e.length})</h4>
    <div class="event-list">
      ${e.map((e,t)=>`
        <div class="event-item">
          <div class="event-description"><strong>Event ${t+1}:</strong> ${e.description}</div>
          <div class="event-details">
            Position: ${Math.round((e.temporalPosition??e.position??0)*100)}% |
            Participants: ${(e.characters?.join(`, `)||e.participants?.join(`, `))??`Unknown`}
            ${e.temporalMarker??e.timeIndicator?`<br>Time: ${e.temporalMarker??e.timeIndicator}`:``}
          </div>
        </div>
      `).join(``)||`<p style="color: #999;">No events found</p>`}
    </div>
  `;return t&&(t.innerHTML=n,document.getElementById(`timelineResults`)?.classList.add(`show`)),n}function ce(e){let t=document.getElementById(`timelineContent`);if(!t)return;let n=e.pacing?.eventDensity??e.eventDensity??0;t.innerHTML=`
    <h4>Complete Timeline</h4>
    <div class="metric"><span>Structure:</span> <strong>${e.structure}</strong></div>
    <div class="metric"><span>Total Events:</span> <strong>${e.events.length}</strong></div>
    <div class="metric"><span>Event Density:</span> <strong>${n.toFixed(2)} events per segment</strong></div>
    <div style="margin-top: 15px;">
      <h5>Timeline:</h5>
      ${q(e.events)}
    </div>
  `,document.getElementById(`timelineResults`)?.classList.add(`show`)}function le(e){let t=document.getElementById(`timelineContent`);t&&(t.innerHTML=`
    <h4>Pacing Analysis</h4>
    <div class="metric"><span>Overall Pace:</span> <strong>${e.overallPace??`N/A`}</strong></div>
    <div class="metric"><span>Event Density:</span> <strong>${e.eventDensity.toFixed(2)}</strong></div>
    <div class="metric"><span>Pacing Variance:</span> <strong>${(e.pacingVariance??0).toFixed(2)}</strong></div>
    ${e.recommendations?.length?`
      <div style="margin-top: 15px;">
        <h5>Recommendations:</h5>
        <ul>${e.recommendations.map(e=>`<li>${e}</li>`).join(``)}</ul>
      </div>
    `:``}
  `,document.getElementById(`timelineResults`)?.classList.add(`show`))}function ue(e){let t=document.getElementById(`timelineContent`);t&&(t.innerHTML=`
    <h4>Narrative Structure</h4>
    <div class="metric"><span>Detected Structure:</span> <strong>${e}</strong></div>
    <p style="margin-top: 10px; font-size: 13px; color: #666;">${V(e)}</p>
  `,document.getElementById(`timelineResults`)?.classList.add(`show`))}function de(e){let t=document.getElementById(`timelineContent`);if(!t)return;let n=typeof e.pacingChange==`object`?e.pacingChange.densityDelta:e.pacingChange??0;t.innerHTML=`
    <h4>Timeline Comparison</h4>
    <div style="margin-top: 15px;">
      <h5 style="color: #4CAF50;">➕ Added Events (${e.addedEvents.length})</h5>
      <div class="event-list">
        ${e.addedEvents.map(e=>`<div class="event-item"><div class="event-description">${e.description}</div></div>`).join(``)||`<p style="color: #999;">None</p>`}
      </div>
    </div>
    <div style="margin-top: 15px;">
      <h5 style="color: #f44336;">➖ Removed Events (${e.removedEvents.length})</h5>
      <div class="event-list">
        ${e.removedEvents.map(e=>`<div class="event-item"><div class="event-description">${e.description}</div></div>`).join(``)||`<p style="color: #999;">None</p>`}
      </div>
    </div>
    <div class="metric">
      <span>Pacing Change:</span>
      <strong>${n>0?`+`:``}${n.toFixed(2)}</strong>
    </div>
  `,document.getElementById(`timelineResults`)?.classList.add(`show`)}function J(){let e=document.getElementById(`complexityResults`),t=document.getElementById(`complexityContent`);t&&(t.innerHTML=`<p style="text-align: center; color: #666;">⏳ Analyzing narrative complexity...</p>`),e?.classList.add(`show`)}function Y(){document.getElementById(`complexityResults`)?.classList.remove(`show`)}function X(e){let t=e.replace(/_/g,` `);return t.charAt(0).toUpperCase()+t.slice(1)}function Z(){return document.getElementById(`text`)?.value??``}async function fe(){let t=Z();if(!t.trim()){e(`Please enter some text first`,`error`);return}J();try{Ce(await s(`/complexity/report`,{text:t})),e(`Complexity analysis complete!`,`success`)}catch(t){e(`Analysis failed: ${t.message}`,`error`),Y()}}async function Q(t,n,r){let i=Z();if(!i.trim()){e(`Please enter some text first`,`error`);return}J();try{r(await s(`/complexity/${t}`,{text:i})),e(`${n} analysis complete!`,`success`)}catch(t){e(`Analysis failed: ${t.message}`,`error`),Y()}}async function pe(){await Q(`threads`,`Plot Threads`,we)}async function me(){await Q(`characters`,`Characters`,Te)}async function he(){await Q(`scenes`,`Scenes`,Ee)}async function ge(){await Q(`readability`,`Readability`,De)}async function _e(){await Q(`density`,`Narrative Density`,Oe)}async function ve(){let t=Z(),n=document.getElementById(`resultText`)?.textContent??``;if(!t.trim()||!n.trim()){e(`Please perform a text operation first to have two versions to compare`,`error`);return}J();try{ke(await s(`/complexity/compare`,{original:t,revised:n})),e(`Complexity comparison complete!`,`success`)}catch(t){e(`Complexity comparison failed: ${t.message}`,`error`),Y()}}function ye(e){return e?`
    <div class="complexity-card">
      <h4>🧵 Plot Threads</h4>
      <div class="metric">
        <span class="metric-label">Active Threads</span>
        <span class="metric-value">${e.threads?.filter(e=>e.status===`active`).length??0}</span>
      </div>
      <div class="metric">
        <span class="metric-label">Thread Complexity</span>
        <span class="metric-value">${Math.round((e.complexityScore??0)*100)}%</span>
      </div>
      <div class="metric">
        <span class="metric-label">Interweaving</span>
        <span class="metric-value">${e.interweaving?.switchCount??0} switches</span>
      </div>
    </div>
  `:``}function be(e){return e?`
    <div class="complexity-card">
      <h4>👥 Characters</h4>
      <div class="metric">
        <span class="metric-label">Total Characters</span>
        <span class="metric-value">${Object.keys(e.characters??{}).length}</span>
      </div>
      <div class="metric">
        <span class="metric-label">Protagonist</span>
        <span class="metric-value">${e.roles?.protagonist??`Unknown`}</span>
      </div>
      <div class="metric">
        <span class="metric-label">POV Switches</span>
        <span class="metric-value">${e.povAnalysis?.switches??0}</span>
      </div>
    </div>
  `:``}function $(e){return e?`
    <div class="complexity-card">
      <h4>🎬 Scenes</h4>
      <div class="metric">
        <span class="metric-label">Scene Count</span>
        <span class="metric-value">${e.scenes?.length??0}</span>
      </div>
      <div class="metric">
        <span class="metric-label">Setting Changes</span>
        <span class="metric-value">${e.settingChangeCount??0}</span>
      </div>
      <div class="metric">
        <span class="metric-label">Transition Smoothness</span>
        <span class="metric-value">${Math.round((e.overallSmoothness??0)*100)}%</span>
      </div>
    </div>
  `:``}function xe(e){return e?`
    <div class="complexity-card">
      <h4>📖 Readability</h4>
      <div class="metric">
        <span class="metric-label">Score</span>
        <span class="metric-value">${Math.round((e.overallScore??0)*100)}%</span>
      </div>
      <div class="metric">
        <span class="metric-label">Level</span>
        <span class="metric-value">${e.readabilityLevel??`Unknown`}</span>
      </div>
      <div class="metric">
        <span class="metric-label">Avg Sentence Length</span>
        <span class="metric-value">${e.avgSentenceLength?.toFixed(1)??0} words</span>
      </div>
    </div>
  `:``}function Se(e){return e?`
    <div class="complexity-card">
      <h4>📊 Narrative Density</h4>
      <div class="metric">
        <span class="metric-label">Ideas per Paragraph</span>
        <span class="metric-value">${e.averageDensity?.toFixed(1)??0}</span>
      </div>
      <div class="metric">
        <span class="metric-label">Exposition</span>
        <span class="metric-value">${Math.round((e.contentBreakdown?.exposition??0)*100)}%</span>
      </div>
      <div class="metric">
        <span class="metric-label">Action</span>
        <span class="metric-value">${Math.round((e.contentBreakdown?.action??0)*100)}%</span>
      </div>
    </div>
  `:``}function Ce(e){let t=document.getElementById(`complexityContent`);t&&(t.innerHTML=`
    <div class="complexity-score">
      <div class="score-value">${Math.round((e.overallComplexity??0)*100)}%</div>
      <div class="score-label">Overall Complexity Score</div>
    </div>
    <div class="complexity-grid">
      ${ye(e.plotThreads??e.plotThreadAnalysis)}
      ${be(e.characterInvolvement)}
      ${$(e.sceneComplexity)}
      ${xe(e.readability)}
      ${Se(e.narrativeDensity)}
    </div>
    ${e.recommendations?.length?`
      <div class="recommendations-list">
        <h4>💡 Recommendations</h4>
        <ul>${e.recommendations.map(e=>`<li>${X(e)}</li>`).join(``)}</ul>
      </div>
    `:``}
  `,document.getElementById(`complexityResults`)?.classList.add(`show`))}function we(e){let t=document.getElementById(`complexityContent`);t&&(t.innerHTML=`
    <div class="complexity-card" style="max-width: 100%;">
      <h4>🧵 Plot Threads Analysis</h4>
      <div class="metric">
        <span class="metric-label">Complexity Score</span>
        <span class="metric-value">${Math.round((e.complexityScore??0)*100)}%</span>
      </div>
      <div class="metric">
        <span class="metric-label">Thread Switches</span>
        <span class="metric-value">${e.interweaving?.switchCount??0}</span>
      </div>
      <div class="thread-list" style="margin-top: 15px;">
        ${(e.threads??[]).map(e=>`
          <div class="thread-item">
            <strong>${e.name}</strong>
            <span class="thread-status ${e.status}">${e.status}</span>
            <div style="margin-top: 4px; color: #666;">${e.description}</div>
            ${e.characters?.length?`<div style="font-size: 11px; color: #999; margin-top: 2px;">Characters: ${e.characters.join(`, `)}</div>`:``}
          </div>
        `).join(``)||`<p style="color: #999;">No threads detected</p>`}
      </div>
    </div>
  `,document.getElementById(`complexityResults`)?.classList.add(`show`))}function Te(e){let t=document.getElementById(`complexityContent`);if(!t)return;let n=Object.entries(e.characters??{});t.innerHTML=`
    <div class="complexity-card" style="max-width: 100%;">
      <h4>👥 Character Analysis</h4>
      <div class="metric">
        <span class="metric-label">Protagonist</span>
        <span class="metric-value">${e.roles?.protagonist??`Unknown`}</span>
      </div>
      <div class="metric">
        <span class="metric-label">POV Switches</span>
        <span class="metric-value">${e.povAnalysis?.switches??0}</span>
      </div>
      <div class="character-list" style="margin-top: 15px;">
        ${n.map(([e,t])=>`
          <div class="character-item">
            <strong>${e}</strong>
            <span style="float: right;">${t.mentions} mentions (${Math.round(t.frequency*100)}%)</span>
          </div>
        `).join(``)||`<p style="color: #999;">No characters detected</p>`}
      </div>
    </div>
  `,document.getElementById(`complexityResults`)?.classList.add(`show`)}function Ee(e){let t=document.getElementById(`complexityContent`);t&&(t.innerHTML=`
    <div class="complexity-card" style="max-width: 100%;">
      <h4>🎬 Scene Analysis</h4>
      <div class="metric">
        <span class="metric-label">Total Scenes</span>
        <span class="metric-value">${e.scenes?.length??0}</span>
      </div>
      <div class="metric">
        <span class="metric-label">Setting Changes</span>
        <span class="metric-value">${e.settingChangeCount??0}</span>
      </div>
      <div class="metric">
        <span class="metric-label">Transition Smoothness</span>
        <span class="metric-value">${Math.round((e.overallSmoothness??0)*100)}%</span>
      </div>
      <div class="scene-list" style="margin-top: 15px;">
        ${(e.scenes??[]).map(e=>`
          <div class="scene-item">
            <strong>${e.location}</strong>
            <span style="float: right; font-size: 11px; color: #666;">
              ${Math.round(e.startPosition*100)}% - ${Math.round(e.endPosition*100)}%
            </span>
          </div>
        `).join(``)||`<p style="color: #999;">No scenes detected</p>`}
      </div>
    </div>
  `,document.getElementById(`complexityResults`)?.classList.add(`show`))}function De(e){let t=document.getElementById(`complexityContent`);t&&(t.innerHTML=`
    <div class="complexity-card" style="max-width: 100%;">
      <h4>📖 Readability Analysis</h4>
      <div class="metric">
        <span class="metric-label">Overall Score</span>
        <span class="metric-value">${Math.round((e.overallScore??0)*100)}%</span>
      </div>
      <div class="metric">
        <span class="metric-label">Readability Level</span>
        <span class="metric-value">${e.readabilityLevel??`Unknown`}</span>
      </div>
      <div class="metric">
        <span class="metric-label">Avg Sentence Length</span>
        <span class="metric-value">${e.avgSentenceLength?.toFixed(1)??0} words</span>
      </div>
      <div class="metric">
        <span class="metric-label">Vocabulary Richness</span>
        <span class="metric-value">${Math.round((e.vocabularyRichness??0)*100)}%</span>
      </div>
      <div class="metric">
        <span class="metric-label">Paragraph Count</span>
        <span class="metric-value">${e.paragraphCount??0}</span>
      </div>
      ${e.recommendations?.length?`
        <div style="margin-top: 15px; padding-top: 10px; border-top: 1px solid #eee;">
          <strong style="font-size: 12px; color: #666;">Suggestions:</strong>
          <ul style="margin: 8px 0 0 0; padding-left: 20px; font-size: 12px;">
            ${e.recommendations.map(e=>`<li>${X(e)}</li>`).join(``)}
          </ul>
        </div>
      `:``}
    </div>
  `,document.getElementById(`complexityResults`)?.classList.add(`show`))}function Oe(e){let t=document.getElementById(`complexityContent`);t&&(t.innerHTML=`
    <div class="complexity-card" style="max-width: 100%;">
      <h4>📊 Narrative Density Analysis</h4>
      <div class="metric">
        <span class="metric-label">Average Density</span>
        <span class="metric-value">${e.averageDensity.toFixed(2)} ideas/paragraph</span>
      </div>
      <div class="metric">
        <span class="metric-label">Exposition</span>
        <span class="metric-value">${Math.round(e.contentBreakdown.exposition*100)}%</span>
      </div>
      <div class="metric">
        <span class="metric-label">Action</span>
        <span class="metric-value">${Math.round(e.contentBreakdown.action*100)}%</span>
      </div>
      <div class="metric">
        <span class="metric-label">Dialogue</span>
        <span class="metric-value">${Math.round(e.contentBreakdown.dialogue*100)}%</span>
      </div>
      <div class="metric">
        <span class="metric-label">Description</span>
        <span class="metric-value">${Math.round(e.contentBreakdown.description*100)}%</span>
      </div>
    </div>
  `,document.getElementById(`complexityResults`)?.classList.add(`show`))}function ke(e){let t=document.getElementById(`complexityContent`);if(!t)return;let n=e.overallChange??0,r=e.threadCountChange??0,i=e.characterCountChange??0,a=e.readabilityChange??0,o=e.summary??`Complexity metrics compared`;t.innerHTML=`
    <h4>Complexity Comparison</h4>
    <div class="metric">
      <span>Overall Change:</span>
      <span style="color: ${n>0?`#4CAF50`:`#f44336`}">
        ${n>0?`+`:``}${Math.round(n*100)}%
      </span>
    </div>
    <div class="metric">
      <span>Thread Count Change:</span>
      <strong>${r>0?`+`:``}${r}</strong>
    </div>
    <div class="metric">
      <span>Character Count Change:</span>
      <strong>${i>0?`+`:``}${i}</strong>
    </div>
    <div class="metric">
      <span>Readability Change:</span>
      <span style="color: ${a>0?`#4CAF50`:`#f44336`}">
        ${a>0?`+`:``}${Math.round(a*100)}%
      </span>
    </div>
    <p style="margin-top: 10px;"><strong>Summary:</strong> ${o}</p>
  `,document.getElementById(`complexityResults`)?.classList.add(`show`)}var Ae={processText:e=>T(e.getAttribute(`data-operation`)),generateSynopsis:()=>E(),exportAs:e=>se(e.getAttribute(`data-format`)??`text`),refreshHistory:()=>h(),viewHistoryItem:e=>v(e.getAttribute(`data-id`)??``),deleteHistoryItem:e=>te(e.getAttribute(`data-id`)??``),downloadHistory:()=>ne(),clearHistoryConfirm:()=>re(),computeAndShowDiff:()=>{let e=document.getElementById(`text`),t=document.getElementById(`resultText`),n=e?.value??``,r=t?.textContent??``;n&&r&&b(n,r)},toggleLineView:()=>w(),loadSessions:()=>f(),createNewSession:()=>p(),switchSession:()=>m(),manageSessions:()=>ee(),analyzeTone:()=>k(),compareTone:()=>A(),computeEmotionalArc:()=>j(),extractEntities:()=>F(),getEntitySummary:()=>I(),compareEntities:()=>L(),extractEvents:()=>H(),buildTimeline:()=>U(),analyzePacing:()=>W(),detectStructure:()=>G(),compareTimelines:()=>K(),analyzeFullComplexity:()=>fe(),analyzeThreads:()=>pe(),analyzeCharacters:()=>me(),analyzeScenes:()=>he(),analyzeReadability:()=>ge(),analyzeDensity:()=>_e(),compareComplexity:()=>ve()};function je(e,t){if(!e)return;let n=Ae[e];n?n(t):console.warn(`Unknown action: ${e}`)}async function Me(){try{(await fetch(`/health`)).ok&&(e(`Connected to Story Time server`,`success`),await h(),await f())}catch{e(`Cannot connect to server. Please start the backend.`,`error`)}}document.addEventListener(`DOMContentLoaded`,()=>{document.addEventListener(`click`,e=>{let t=e.target.closest(`[data-action]`);t&&je(t.getAttribute(`data-action`),t)}),document.getElementById(`sessionSelector`)?.addEventListener(`change`,()=>m()),Me()});