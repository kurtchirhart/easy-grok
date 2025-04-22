// ==UserScript==
    // @name         Highlight User Message Bubble with Marquee Sidebar on Grok.com
    // @namespace    http://tampermonkey.net/
    // @version      2.8
    // @description  Highlights user message-bubble divs with a marquee sidebar on grok.com
    // @author       You
    // @match        https://grok.com/*
    // @grant        GM_addStyle
    // @grant        GM.getValue
    // @grant        GM.setValue
    // @updateURL    https://raw.githubusercontent.com/kurtchirhart/easy-grok/master/easy-grok.js
    // @downloadURL  https://raw.githubusercontent.com/kurtchirhart/easy-grok/master/easy-grok.js
    // ==/UserScript==

    (async function() {
        'use strict';

        // --- Debug Flag ---
        // Enable (true) or disable (false) debug logging
        var D = true;

        // --- Styles ---
        // Defines CSS for highlighting messages, sidebar appearance, marquee effect, and settings UI
        let userPromptBgColor = '#ffeb3b';
        let userPromptTextColor = '#000';
        let editTextColor = '#FFFFFF';
        try {
            userPromptBgColor = await GM.getValue('userPromptBgColor', '#ffeb3b');
            userPromptTextColor = await GM.getValue('userPromptTextColor', '#000');
            editTextColor = await GM.getValue('editTextColor', '#FFFFFF');
        } catch (e) {
            console.error('Failed to get color values:', e);
        }
        GM_addStyle(`
            .user-message-highlight {
                background-color: ${userPromptBgColor} !important;
                color: ${userPromptTextColor} !important;
            }
            textarea.w-screen.max-w-\\[100\\%\\].bg-transparent.focus\\:outline-none.text-primary {
                color: ${editTextColor} !important;
            }
            .floating-sidebar {position:fixed;top:2.5vh;left:-15vw;width:10ch;height:95vh;background:#333;color:#fff;padding:10px;z-index:9999;overflow-y:auto;box-sizing:border-box;transition:left 0.3s;}
            .floating-sidebar.visible {left:0;}
            .floating-sidebar h3 {margin:0 0 10px;font-size:14px;}
            .floating-sidebar a {color:#fff;text-decoration:none;display:block;padding:5px;font-size:12px;}
            .floating-sidebar a:hover .marquee-text {animation:marquee 5s linear infinite;}
            .marquee-container {width:8ch;overflow:hidden;white-space:nowrap;}
            .marquee-text {display:inline-block;}
            @keyframes marquee {0% {transform:translateX(0);} 100% {transform:translateX(-100%);}}
            .hover-area {position:fixed;top:0;left:0;width:5px;height:100vh;z-index:9998;}
            .gear-icon {cursor:pointer;color:#fff;font-size:14px;margin-bottom:10px;}

            .ssettings-panel {display:flex;flex-direction:row;gap:20px;position:fixed;top:10vh;left:20vw;background:#333;padding:20px;border-radius:20px;z-index:10000;box-shadow:0 0 10px rgba(0,0,0,0.5);}
            .ssettings-panel.visible {display:flex;}

            .settings-panel {display:none;position:fixed;top:10vh;left:20vw;background:#333;padding:20px;border-radius:20px;z-index:10000;box-shadow:0 0 10px rgba(0,0,0,0.5);flex-direction:row;gap:20px;}
            .settings-panel.visible {display:flex;}

            .settings-panel .column {display:flex;flex-direction:column;gap:5px;}
            .settings-panel .row {display:flex;flex-direction:row;gap:5px;}
            
            .settings-panel .preview-area {padding:10px;border-radius:10px;margin-bottom:10px;}
            .settings-panel .title-label {color:#FF8000;font-weight:bold;font-size:16px;}
            .settings-panel .subtitle-label {color:#FFFFFF;font-weight:bold;font-size:14px;}
            .settings-panel label {display:block;margin:5px 0;color:#FFFFFF;}
            
            input[type="color"]::-webkit-color-swatch { border: 2px; border-radius: 15px; }
            input[type="color"]::-webkit-color-swatch-wrapper { padding: 0; }

            .settings-panel input[type="color"] {width:40px;height:40px;margin-left:10px;}
            .settings-panel button {margin-top:10px;padding:5px 10px;background:#555;border:none;color:#fff;border-radius:5px;cursor:pointer;}
            .settings-panel button:hover {background:#666;}
        `);

        // --- Sidebar Setup ---
        // Initialize sidebar, processed messages set, and message counter
        const processed = new Set();
        let messageCounter = 0;
        let negativeMessageCounter = -1;
        const sidebar = document.createElement('div');
        sidebar.className = 'floating-sidebar';
        sidebar.innerHTML = '<h3>Prompts</h3>';
        document.body.appendChild(sidebar);
        if (D) console.log('Sidebar initialized and appended to document body');

        // --- Gear Icon Setup ---
        // Add gear icon to toggle settings panel
        const gearIcon = document.createElement('div');
        gearIcon.className = 'gear-icon';
        gearIcon.textContent = '⚙️';
        sidebar.insertBefore(gearIcon, sidebar.querySelector('h3').nextSibling);
        if (D) console.log('Gear icon added to sidebar');

        // --- Settings Panel Setup ---
        // Create a floating settings panel with color pickers and preview
        const settingsPanel = document.createElement('div');
        settingsPanel.className = 'settings-panel';
        const bgColor = await GM.getValue('userPromptBgColor', '#ffeb3b');
        const textColor = await GM.getValue('userPromptTextColor', '#000');
        const editColor = await GM.getValue('editTextColor', '#FFFFFF');
        settingsPanel.innerHTML = `
        <div class="column">
            <div class="row">
                <div class="preview-area" style="background-color:${bgColor};">
                    <span class="title-label" style="color:${textColor};">Text Color</span>
                    <br>
                    <span class="subtitle-label" style="color:${editColor};">Edit Text Color</span>
                </div>
                <div class="column">
                    <input type="color" id="bgColorPicker" value="${bgColor}">
                    <input type="color" id="textColorPicker" value="${textColor}">
                    <input type="color" id="editTextColorPicker" value="${editColor}">
                </div>
            </div>
            <button id="saveSettings">Save</button>
            <button id="closeSettings">Close</button>
        </div>
        `;
        document.body.appendChild(settingsPanel);
        if (D) console.log('Settings panel created and appended to document body');

        // --- Settings Panel Event Listeners ---
        // Toggle settings panel visibility, handle save/close, and update preview dynamically
        gearIcon.addEventListener('click', () => {
            settingsPanel.classList.toggle('visible');
            if (D) console.log('Settings panel toggled:', settingsPanel.classList.contains('visible'));
        });

        const previewArea = settingsPanel.querySelector('.preview-area');
        const titleLabel = settingsPanel.querySelector('.title-label');
        const subtitleLabel = settingsPanel.querySelector('.subtitle-label');

        document.getElementById('bgColorPicker').addEventListener('input', (e) => {
            previewArea.style.backgroundColor = e.target.value;
        });

        document.getElementById('textColorPicker').addEventListener('input', (e) => {
            titleLabel.style.color = e.target.value;
        });

        document.getElementById('editTextColorPicker').addEventListener('input', (e) => {
            subtitleLabel.style.color = e.target.value;
        });

        document.getElementById('saveSettings').addEventListener('click', async () => {
            const bgColor = document.getElementById('bgColorPicker').value;
            const textColor = document.getElementById('textColorPicker').value;
            const editTextColor = document.getElementById('editTextColorPicker').value;
            try {
                await GM.setValue('userPromptBgColor', bgColor);
                await GM.setValue('userPromptTextColor', textColor);
                await GM.setValue('editTextColor', editTextColor);
                window.location.reload(); // Reload to apply new styles
                if (D) console.log('Settings saved: Background:', bgColor, 'Text:', textColor, 'Edit Text:', editTextColor);
            } catch (e) {
                console.error('Failed to save settings:', e);
            }
        });

        document.getElementById('closeSettings').addEventListener('click', () => {
            settingsPanel.classList.remove('visible');
            if (D) console.log('Settings panel closed');
        });

        // --- Hover Area Setup ---
        // Create a hover area to trigger sidebar visibility
        const hoverArea = document.createElement('div');
        hoverArea.className = 'hover-area';
        document.body.appendChild(hoverArea);
        if (D) console.log('Hover area created and appended to document body');

        // --- Event Listeners for Auto-Hide ---
        // Show sidebar on hover over hover area or sidebar, hide when mouse leaves sidebar
        hoverArea.addEventListener('mouseover', () => {
            sidebar.classList.add('visible');
            if (D) console.log('Hover area mouseover: Sidebar made visible');
        });
        sidebar.addEventListener('mouseover', () => {
            sidebar.classList.add('visible');
            if (D) console.log('Sidebar mouseover: Sidebar kept visible');
        });
        sidebar.addEventListener('mouseout', () => {
            sidebar.classList.remove('visible');
            if (D) console.log('Sidebar mouseout: Sidebar hidden');
        });

        // --- Message Highlighting and Sidebar Linking ---
        // Process message-bubble divs, highlight user messages, and add links to sidebar
        const highlightUserBubbles = (nodes) => {
            if (D) console.log('highlightUserBubbles called with nodes:', nodes.length);
            const firstLink = sidebar.querySelector('a');
            const firstMessageNode = firstLink ? document.querySelector(firstLink.href.split('#')[1] ? `#${firstLink.href.split('#')[1]}` : null) : null;
            if (D) console.log('First link in sidebar:', firstLink, 'First message node:', firstMessageNode);
            nodes.forEach(node => {
                if (node.nodeType !== 1 || processed.has(node)) return;
                if (node.classList.contains('message-bubble')) {
                    const hasSpan = node.querySelector('span.whitespace-pre-wrap');
                    const hasParagraph = node.querySelector('p');
                    const isUser = hasSpan && !hasParagraph && !node.classList.contains('w-full');
                    if (D) console.log('Processing node:', node, 'Is user message:', isUser);
                    if (isUser) {
                        const currentCounter = firstMessageNode && node.getBoundingClientRect().top < firstMessageNode.getBoundingClientRect().top ? negativeMessageCounter-- : messageCounter + 1;
                        if (currentCounter > 0) messageCounter++;
                        node.id = `user-message-${Math.abs(currentCounter)}`;
                        node.classList.add('user-message-highlight');
                        const link = document.createElement('a');
                        link.href = `#user-message-${Math.abs(currentCounter)}`;
                        const container = document.createElement('div');
                        container.className = 'marquee-container';
                        const marqueeText = document.createElement('span');
                        marqueeText.className = 'marquee-text';
                        marqueeText.textContent = `${currentCounter}-${node.textContent.slice(0, 8)}`;
                        container.appendChild(marqueeText);
                        link.appendChild(container);
                        link.onclick = (e) => {
                            e.preventDefault();
                            const chatContainer = document.querySelector('div.w-full.h-full.overflow-y-auto');
                            const rect = node.getBoundingClientRect();
                            const containerRect = chatContainer.getBoundingClientRect();
                            const topPosition = rect.top - containerRect.top + chatContainer.scrollTop;
                            chatContainer.scrollTo({top:topPosition - 50, behavior:'smooth'});
                            if (D) console.log(`Clicked link ${currentCounter}: Scrolling to topPosition ${topPosition - 50}`);
                        };
                        link.onmouseover = () => {
                            marqueeText.textContent = `${currentCounter}-${node.textContent.slice(0, 256)}`;
                            if (D) console.log(`Mouseover on link ${currentCounter}: Marquee text set to full`);
                        };
                        link.onmouseout = () => {
                            marqueeText.textContent = `${currentCounter}-${node.textContent.slice(0, 8)}`;
                            if (D) console.log(`Mouseout on link ${currentCounter}: Marquee text set to short`);
                        };
                        if (firstMessageNode && node.getBoundingClientRect().top < firstMessageNode.getBoundingClientRect().top) {
                            sidebar.insertBefore(link, sidebar.querySelector('a'));
                            if (D) console.log(`Prepending link ${currentCounter}: Node is above first message`);
                        } else {
                            sidebar.appendChild(link);
                            if (D) console.log(`Appending link ${currentCounter}: Node is below first message or no first message`);
                        }
                    }
                    processed.add(node);
                }
            });
        };

        // --- Chat Container Monitoring ---
        // Wait for the chat container to appear, then monitor for new message-bubble divs
        const waitForChatContainer = () => {
            if (D) console.log('Starting container observer to find chat container');
            const containerObserver = new MutationObserver((mutations, observer) => {
                const chatContainer = document.querySelector('div.w-full.h-full.overflow-y-auto');
                if (chatContainer) {
                    observer.disconnect();
                    if (D) console.log('Chat container found, starting bubble observer');
                    const bubbleObserver = new MutationObserver(mutations => {
                        if (D) console.log('Bubble MO fired at', new Date().toISOString(), 'Mutations:', mutations);
                        mutations.forEach(m => {
                            if (m.addedNodes.length > 0) {
                                highlightUserBubbles(Array.from(m.addedNodes).filter(node => node.nodeType === 1 && node.classList.contains('message-bubble')));
                            }
                        });
                        highlightUserBubbles(chatContainer.querySelectorAll('div.message-bubble'));
                    });
                    bubbleObserver.observe(chatContainer, { childList: true, subtree: true });
                }
            });
            containerObserver.observe(document.body, { childList: true, subtree: true });
        };
        waitForChatContainer();
    })();