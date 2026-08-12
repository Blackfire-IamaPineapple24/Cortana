// Variables ------------------------------------
let sidebarIsOpen = false;
let currentPage = 0;
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
        document.getElementById('sidebar').classList.remove('open');
        sidebarIsOpen = false;
    }
}

function ForceCloseSidebar()
{
    document.getElementById('sidebar').classList.remove('open');
    sidebarIsOpen = false;
}

function SetPage(pageNumber)
{
    // Quick references to the page divs
    chatPage = document.getElementById('chat');
    notePage = document.getElementById('notebook');
    settPage = document.getElementById('settings');

    // Set the page
    if (pageNumber == 0)
    {
        chatPage.style.display = 'block';
        notePage.style.display = 'none';
        settPage.style.display = 'none';
    }
    else if (pageNumber == 1)
    {
        chatPage.style.display = 'none';
        notePage.style.display = 'block';
        settPage.style.display = 'none';
    }
    else
    {
        chatPage.style.display = 'none';
        notePage.style.display = 'none';
        settPage.style.display = 'block';
    }
    currentPage = pageNumber;
}

// Simulate a click on an <a> element because something is deeply wrong with JavaScript
function SimulateLink(location)
{
    let a = document.createElement('a');
    a.href = location;
    a.target = '_blank'; // To open in a new browser window
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}