// ==UserScript==
    // @name         Highlight User Message Bubble with Marquee Sidebar on Grok.com
    // @namespace    http://tampermonkey.net/
    // @version      2.0
    // @description  Highlights user message-bubble divs with a marquee sidebar on grok.com
    // @author       You
    // @match        https://grok.com/*
    // @grant        GM_addStyle
    // @updateURL    https://raw.githubusercontent.com/kurtchirhart/easy-grok/master/easy_grok.js
    // @downloadURL  https://raw.githubusercontent.com/kurtchirhart/easy-grok/master/easy_grok.js
    // ==/UserScript==

    (function() {
        'use strict';

        // --- Styles ---
        GM_addStyle(`
            .user-message-highlight {background-color:#ffeb3b !important;color:#000 !important;}
            .floating-sidebar {position:fixed;top:2.5vh;left:-15vw;width:10ch;height:95vh;background:#333;color:#fff;padding:10px;z-index:9999;overflow-y:auto;box-sizing:border-box;transition:left 0.3s;}
            .floating-sidebar.visible {left:0;}
            .floating-sidebar h3 {margin:0 0 10px;font-size:14px;}
            .floating-sidebar a {color:#fff;text-decoration:none;display:block;padding:5px;font-size:12px;}
            .floating-sidebar a:hover .marquee-text {animation:marquee 5s linear infinite;}
            .marquee-container {width:8ch;overflow:hidden;white-space:nowrap;}
            .marquee-text {display:inline-block;}
            @keyframes marquee {0% {transform:translateX(0);} 100% {transform:translateX(-100%);}}
            .hover-area {position:fixed;top:0;left:0;width:5px;height:100vh;z-index:9998;}
        `);

        // --- Sidebar Setup ---
        const processed = new Set();
        let messageCounter = 0;
        const sidebar = document.createElement('div');
        sidebar.className = 'floating-sidebar';
        sidebar.innerHTML = '<h3>User Messages</h3>';
        document.body.appendChild(sidebar);

        // --- Hover Area Setup ---
        const hoverArea = document.createElement('div');
        hoverArea.className = 'hover-area';
        document.body.appendChild(hoverArea);

        // --- Event Listeners for Auto-Hide ---
        hoverArea.addEventListener('mouseover', () => sidebar.classList.add('visible'));
        sidebar.addEventListener('mouseover', () => sidebar.classList.add('visible'));
        sidebar.addEventListener('mouseout', () => sidebar.classList.remove('visible'));

        // --- Message Highlighting and Sidebar Linking ---
        const highlightUserBubbles = (nodes) => {
            nodes.forEach(node => {
                if (node.nodeType !== 1 || processed.has(node)) return;
                if (node.classList.contains('message-bubble')) {
                    const hasSpan = node.querySelector('span.whitespace-pre-wrap');
                    const hasParagraph = node.querySelector('p');
                    const isUser = hasSpan && !hasParagraph && !node.classList.contains('w-full');
                    if (isUser) {
                        const currentCounter = messageCounter + 1;
                        messageCounter++;
                        node.id = `user-message-${currentCounter}`;
                        node.classList.add('user-message-highlight');
                        const link = document.createElement('a');
                        link.href = `#user-message-${currentCounter}`;
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
                        };
                        link.onmouseover = () => {marqueeText.textContent = `${currentCounter}-${node.textContent.slice(0, 256)}`;};
                        link.onmouseout = () => {marqueeText.textContent = `${currentCounter}-${node.textContent.slice(0, 8)}`;};
                        sidebar.appendChild(link);
                    }
                    processed.add(node);
                }
            });
        };

        // --- Chat Container Monitoring ---
        const waitForChatContainer = () => {
            const containerObserver = new MutationObserver((mutations, observer) => {
                const chatContainer = document.querySelector('div.w-full.h-full.overflow-y-auto');
                if (chatContainer) {
                    observer.disconnect();
                    const bubbleObserver = new MutationObserver(mutations => {
                        console.log('Bubble MO fired at', new Date().toISOString(), 'Mutations:', mutations);
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