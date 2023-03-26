const getKey = () => {
        return new Promise((resolve, reject) => {
            chrome.storage.local.get(['openai-key'], (result) => {
                if (result['openai-key']) {
                    const decodedKey = atob(result['openai-key']);
                    resolve(decodedKey);
                }
            });
        });
    };


const generate = async (prompt) => {
    const key = await getKey();

    const url = 'https://api.openai.com/v1/chat/completions';
    const completionResponse = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [{role: 'user', content: prompt}],
        }),
    });

    return await completionResponse.json();
};


const generateCompletionAction = async (info) => {
    try {
        const {selectionText} = info;
        const basePromptPrefix =
            `
            
        This is an AI language model that can provide feedback on a code snippet. It will check the following points:  
            - The code follows good coding conventions and practices.
            - The code is easy to read and understand.
            - The variables are clearly named and descriptive.
            - The code is efficient and runs smoothly.
            
        The code snippet you would like feedback on:    
        ${selectionText}
      `;

        const baseCompletion = await generate(basePromptPrefix);
        console.log(baseCompletion);

        // Create a new window to display the completion
        chrome.windows.create({
            url: `data:text/html;charset=UTF-8,
                <html>
                    <body>
                        <div class="prompt">${JSON.stringify(baseCompletion.choices[0].message.content.replaceAll('\n', '<br>'), null, 2)}
                        </div>
                    </body>
                        <style>
                            .prompt {
                                font-family: sans-serif;
                                font-size: 16px;
                                line-height: 1.5;
                                margin: 20px;
                                padding: 20px;
                                border: 1px solid #ccc;
                                border-radius: 5px;
                                background-color: #f5f5f5;
                                color: #333;
                            }
                        </style>
                </html>`,
            type: 'popup',
            width: 80,
            height: 160,
        });
    } catch (error) {
        console.log(error);
    }
};

chrome.contextMenus.create({
    id: 'context-run',
    title: 'Review code',
    contexts: ['selection'],
});

chrome.contextMenus.onClicked.addListener(generateCompletionAction);