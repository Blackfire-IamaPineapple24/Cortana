// Variables ------------------------------------
let sidebarIsOpen = false;
let currentPage = 'chat';
// ----------------------------------------------

function ToggleSidebar()
{
    if (!sidebarIsOpen)
    {
        document.getElementById('sidebar').classList.add('open');
        sidebarIsOpen = true;
    }
    else
    {
        CloseSidebar();
    }
}

function CloseSidebar()
{
    document.getElementById('sidebar').classList.remove('open');
    sidebarIsOpen = false;
}

function SetPage(pageName)
{
    // Quick references to the page divs
    chatPage = document.getElementById('chat');
    notePage = document.getElementById('notebook');
    settPage = document.getElementById('settings');

    // Set the page
    if (pageName == 'chat')
    {
        chatPage.style.display = 'block';
        notePage.style.display = 'none';
        settPage.style.display = 'none';
    }
    else if (pageName == 'notebook')
    {
        chatPage.style.display = 'none';
        notePage.style.display = 'block';
        settPage.style.display = 'none';
    }
    else if (pageName == 'settings')
    {
        chatPage.style.display = 'none';
        notePage.style.display = 'none';
        settPage.style.display = 'block';
    }
    currentPage = pageName;
}

function ClearText(target)
{
    target.value = '';
}

// Save the name to a file.
function ConfirmName()
{
    const nameInput = document.getElementById('user-name');

    if (nameInput && nameInput.value.trim() !== '')
    {
        window.electronAPI.SetName(nameInput.value.trim());
    }
}

/* Once content has loaded, start saving text every time the content
   of the text box changes. */
window.addEventListener('DOMContentLoaded', () =>
{
    const nameInput = document.getElementById('user-name');

    nameInput?.addEventListener('input', () =>
    {
        if (nameInput.value == '')
        {
            window.electronAPI.SetName('');
        }
        else
        {
            ConfirmName();
        }
    });
});

// IPC Listeners
window.electronAPI.OnLoadName((name) =>
{
    document.getElementById('user-name').value = name;
});