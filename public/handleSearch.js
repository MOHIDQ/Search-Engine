function getSearchResult() {
    let searchValue = document.getElementById("searchInput").value
    let searchLimit = document.getElementById("numOfResults").value
    let isBoost = document.getElementById("boostOption").options[document.getElementById("boostOption").selectedIndex].value;
    let data = document.getElementById("dataOption").options[document.getElementById("dataOption").selectedIndex].value
    
    if (searchLimit < 1 | searchLimit > 50) {
        searchLimit = 10 // default 10
    }
    let url = `http://3.138.215.232:3000/${data}?q=${searchValue}&limit=${searchLimit}&boost=${isBoost}`

    window.open(url)
    
}