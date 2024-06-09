
const owner = 'ejazz-ahmad';
const repo_name = 'ejazz-ahmad.github.io';
const backslash = '/';

const baseUrl = 'https://api.github.com/repos/' + owner + backslash + repo_name;
const token = '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';

async function createButtons() {
    const url = baseUrl + '/actions/workflows';

    fetch(url, {
        method: 'GET',
        headers: {
            'Accept': 'application/vnd.github.v3+json',
            'Authorization': `token ${token}`
        }
    })
    .then(response => response.json())
    .then(data => {
        data.workflows.forEach(workflow => {
            createButtonBox(workflow.path, workflow.name);
        });
    })
    .catch(error => {
        console.error('Error fetching workflows:', error);
    });
}

function createButtonBox(path, workflow_name) {
    // Create the div element
    const buttonBox = document.createElement('div');
    buttonBox.className = 'button-box';
    buttonBox.path = path;
    buttonBox.name = workflow_name;
    buttonBox.onclick = openForm;

    // Create the h2 element
    const heading = document.createElement('h2');
    heading.textContent = workflow_name;

    // Create the p element
    const paragraph = document.createElement('p');
    paragraph.textContent = workflow_name;

    // Append h2 and p to the div
    buttonBox.appendChild(heading);
    buttonBox.appendChild(paragraph);

    // Append the div to the body or any other container element
    document.getElementById('container').appendChild(buttonBox);
}

function openForm(element) {
    localStorage.setItem('path', element.currentTarget.path)
    localStorage.setItem('workflow_name', element.currentTarget.name)
    window.location.href = 'trigger_workflow.html';
}

function createFields() {
    const url = baseUrl + '/contents/' + localStorage.getItem('path');

    document.getElementById('workflow_name').textContent = localStorage.getItem('workflow_name')

    addBranchesDropdown();

    // Fetch the workflow content from GitHub API
    fetch(url, {
        method: 'GET',
        headers: {
            'Accept': 'application/vnd.github.v3+json',
            'Authorization': `token ${token}`
        }
    })
    .then(response => response.json()) // Parse the JSON from the response
    .then(data => {

        // Decode the base64 content field
        if (data.content) {
            const decodedContent = atob(data.content);
            const jsonData = jsyaml.load(decodedContent);
            console.log(jsonData.on.workflow_dispatch); 

            if(jsonData.on != undefined 
            && jsonData.on != null 
            && jsonData.on.workflow_dispatch != undefined 
            && jsonData.on.workflow_dispatch != null
            && jsonData.on.workflow_dispatch.inputs != undefined 
            && jsonData.on.workflow_dispatch.inputs != null) {
            
                const keys = Object.keys(jsonData.on.workflow_dispatch.inputs);
                keys.forEach(key => {
                        addInputField(jsonData.on.workflow_dispatch.inputs[key]["description"],
                        jsonData.on.workflow_dispatch.inputs[key]["required"],
                        key
                        )
                });
            }
            
        } else {
            console.error('Error creating the fields');
        }
    })
    .catch(error => {
        console.error('Error fetching the workflow content:', error);
    });
}

function addInputField(labelTxt, required, param_name) {
    const formGroup = document.createElement('div');
    formGroup.classList.add('form-group');

    const label = document.createElement('label');
    label.textContent = labelTxt;

    const input = document.createElement('input');
    input.param_name = param_name;
    input.setAttribute('type', 'text');
    input.setAttribute('required', required);
    input.classList.add('form-control');

    formGroup.appendChild(label);
    formGroup.appendChild(input);

    // Append the new div to the form
    const form = document.querySelector('form');
    form.insertBefore(formGroup, form.lastElementChild);
}

const fetchBranches = async () => {
    const url = baseUrl + '/branches';

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/vnd.github.v3+json',
                'Authorization': `token ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();
        return data.map(branch => branch.name);
        
    } catch (error) {
        console.error('Error fetching branches:', error);
    }
};

async function addBranchesDropdown() {

    const formGroup = document.createElement('div');
    formGroup.classList.add('form-group');

    const label = document.createElement('label');
    label.textContent = 'Branches';

    // Create the select element
    const select = document.createElement('select');
    select.setAttribute('required', true)
    select.className = 'form-control';  // Add a class for styling
    select.id = 'branches_dropdown';  // Set an ID for the dropdown
    select.name = 'branches_dropdown';  // Set a name for the dropdown

    // Create options for the select element
    const branchNames = await fetchBranches();

    // Append each option to the select element
    branchNames.forEach(branchName => {
        const option = document.createElement('option');
        option.value = branchName;
        option.text = branchName;
        select.appendChild(option);
    });

    formGroup.appendChild(label);
    formGroup.appendChild(select);

    // Get the parent div
    const form = document.querySelector('form');
    form.insertBefore(formGroup, form.firstElementChild);
}

function triggerWorkFlow() {

    const form = document.querySelector('form');
    const input_elements = form.getElementsByTagName('input');

    var payload = {};

    payload['ref'] = document.getElementById('branches_dropdown').value
    payload['inputs'] = {}

    for (var i = 0; i < input_elements.length; i++) {
        var input_element = input_elements[i];
        payload['inputs'][input_element.param_name] = input_element.value;
    }

    const url = baseUrl + '/actions/workflows/' + localStorage.getItem('path').split('/')[2] + '/dispatches';
    console.log(JSON.stringify(payload));
        // Make the fetch request
        fetch(url, {
            method: 'POST',
            headers: {
                'Accept': 'application/vnd.github.v3+json',
                'Authorization': 'token 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'
            },
            body: JSON.stringify(payload)
        })
    .then(response => {
        if (response.ok) {

            for (var i = 0; i < input_elements.length; i++) {
                input_elements[i].value = '';
            }

            return response.json();
        } else {
            throw new Error('Failed to trigger workflow');
        }
    })
    .then(data => {
        console.log('Workflow triggered successfully:', data);
    })
    .catch(error => {
        console.error('Error triggering workflow:', error.message);
    });


}
