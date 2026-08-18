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

function GetColourSetting()
{
    const radioGroup = document.getElementById('colour-mode-select');
    const selected = radioGroup.querySelector('input[name="colour-mode"]:checked');
    return selected ? selected.value : null;
}

function SaveColourMode()
{
    const colourMode = GetColourSetting();
    if (colourMode) window.electronAPI.SetColour(colourMode);

    SetColourMode();
}

async function SetColourMode()
{
    const mode = await window.electronAPI.GetTheme();

    // Set the colour mode using CSS
    if (mode == 'light')
    {
        document.body.classList.add('light-mode');
    }
    else
    {
        document.body.classList.remove('light-mode');
    }
}

function LoadColourMode(mode, rawText) // mode is the colour mode to set, rawText is the button value.
{
    /* I did try to use document.querySelector here but it didn't
       work. I still don't know why. */
    document.getElementById(`${rawText}-colour`).checked = true;
    
    // Set the colour mode using CSS
    if (mode == 'light')
    {
        document.body.classList.add('light-mode');
    }
    else
    {
        document.body.classList.remove('light-mode');
    }
}

function UpdateSystemTheme(isDark)
{
    // Set the colour mode using CSS
    if (!isDark)
    {
        document.body.classList.add('light-mode');
    }
    else
    {
        document.body.classList.remove('light-mode');
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

window.electronAPI.OnLoadColour((colourMode, rawText) =>
{
    LoadColourMode(colourMode, rawText);
})

window.electronAPI.OnSystemThemeUpdate((isDark) =>
{
    UpdateSystemTheme(isDark);
})