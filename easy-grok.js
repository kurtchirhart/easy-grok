// ==UserScript==
    // @name         Highlight User Message Bubble with Left Autohide Sidebar on Grok.com
    // @namespace    http://tampermonkey.net/
    // @version      1.4
    // @description  Highlights user message-bubble divs with a left autohide sidebar on grok.com
    // @author       You
    // @match        https://grok.com/*
    // @grant        GM_addStyle
    // ==/UserScript==

    (function() {
        'use strict';
        GM_addStyle(`
            .user-message-highlight {background-color:#ffeb3b !important;color:#000 !important;}
            .floating-sidebar {position:fixed;top:2.5vh;left:-15vw;width:15vw;height:95vh;background:#333;color:#fff;padding:10px;z-index:9999;overflow-y:auto;box-sizing:border-box;transition:left 0.3s;}
            .floating-sidebar.visible {left:0;}
            .floating-sidebar h3 {margin:0 0 10px;font-size:14px;}
            .floating-sidebar a {color:#fff;text-decoration:none;display:block;padding:5px;font-size:12px;}
            .floating-sidebar a:hover {background:#555;}
            .hover-area {position:fixed;top:0;left:0;width:5px;height:100vh;z-index:9998;}
        `);

        const processed = new Set();
        const sidebar = document.createElement('div');
        sidebar.className = 'floating-sidebar';
        sidebar.innerHTML = '<h3>User Messages</h3>';
        document.body.appendChild(sidebar);
// ==UserScript==
    // @name         Highlight User Message Bubble with Ordered Sidebar on Grok.com
    // @namespace    http://tampermonkey.net/
    // @version      1.5
    // @description  Highlights user message-bubble divs with an ordered left sidebar on grok.com
    // @author       You
    // @match        https://grok.com/*
    // @grant        GM_addStyle
    // ==/UserScript==

    (function() {
        'use strict';
        GM_addStyle(`
            .user-message-highlight {background-color:#ffeb3b !important;color:#000 !important;}
            .floating-sidebar {position:fixed;top:2.5vh;left:-15vw;width:15vw;height:95vh;background:#333;color:#fff;padding:10px;z-index:9999;overflow-y:auto;box-sizing:border-box;transition:left 0.3s;}
            .floating-sidebar.visible {left:0;}
            .floating-sidebar h3 {margin:0 0 10px;font-size:14px;}
            .floating-sidebar a {color:#fff;text-decoration:none;display:block;padding:5px;font-size:12px;}
            .floating-sidebar a:hover {background:#555;}
            .hover-area {position:fixed;top:0;left:0;width:5px;height:100vh;z-index:9998;}
        `);

        const processed = new Set();
        let messageCounter = 0;
        const sidebar = document.createElement('div');
        sidebar.className = 'floating-sidebar';
        sidebar.innerHTML = '<h3>User Messages</h3>';
        document.body.appendChild(sidebar);

        const hoverArea = document.createElement('div');
        hoverArea.className = 'hover-area';
        document.body.appendChild(hoverArea);

        hoverArea.addEventListener('mouseover', () => sidebar.classList.add('visible'));
        sidebar.addEventListener('mouseover', () => sidebar.classList.add('visible'));
        sidebar.addEventListener('mouseout', () => sidebar.classList.remove('visible'));

        const highlightUserBubbles = (nodes) => {
            nodes.forEach(node => {
                if (node.nodeType !== 1 || processed.has(node)) return;
                if (node.classList.contains('message-bubble')) {
                    const hasSpan = node.querySelector('span.whitespace-pre-wrap');
                    const hasParagraph = node.querySelector('p');
                    const isUser = hasSpan && !hasParagraph && !node.classList.contains('w-full');
                    if (isUser) {
                        node.id = `user-message-${messageCounter}`;
                        node.classList.add('user-message-highlight');
                        const link = document.createElement('a');
                        link.href = `#user-message-${messageCounter}`;
                        link.textContent = `Message ${messageCounter + 1}: ${node.textContent.slice(0, 20)}...`;
                        link.onclick = (e) => {e.preventDefault(); node.scrollIntoView({behavior: 'smooth'});};
                        sidebar.appendChild(link);
                        messageCounter++;
                    }
                    processed.add(node);
                }
            });
        };

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
        const hoverArea = document.createElement('div');
        hoverArea.className = 'hover-area';
        document.body.appendChild(hoverArea);

        hoverArea.addEventListener('mouseover', () => sidebar.classList.add('visible'));
        sidebar.addEventListener('mouseover', () => sidebar.classList.add('visible'));
        sidebar.addEventListener('mouseout', () => sidebar.classList.remove('visible'));

        const highlightUserBubbles = (nodes) => {
            nodes.forEach(node => {
                if (node.nodeType !== 1 || processed.has(node)) return;
                if (node.classList.contains('message-bubble')) {
                    const hasSpan = node.querySelector('span.whitespace-pre-wrap');
                    const hasParagraph = node.querySelector('p');
                    const isUser = hasSpan && !hasParagraph && !node.classList.contains('w-full');
                    if (isUser) {
                        const index = processed.size;
                        node.id = `user-message-${index}`;
                        node.classList.add('user-message-highlight');
                        const link = document.createElement('a');
                        link.href = `#user-message-${index}`;
                        link.textContent = `Message ${index + 1}: ${node.textContent.slice(0, 20)}...`;
                        link.onclick = (e) => {e.preventDefault(); node.scrollIntoView({behavior: 'smooth'});};
                        sidebar.appendChild(link);
                    }
                    processed.add(node);
                }
            });
        };

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
