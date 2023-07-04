let searchInput = document.getElementById('username/email');
let sortInput = document.getElementById('sort');
let cheakinInput = document.getElementById('cheakin');
let timeInput = document.getElementById('time');
let mytable = document.getElementById('mytable');




let states = {
    search: "",
    sort: 1,
    cheakin: 0,
    time: 0
}

searchInput.onchange = () => {
    startLoading();
    states.search = searchInput.value;
    foo();
}
sortInput.addEventListener('change', () => {
    startLoading();
    states.sort = parseInt(sortInput.value);
    loadData();
})
cheakinInput.addEventListener('change', () => {
    startLoading();
    states.cheakin = parseInt(cheakinInput.value);
    loadData();
})
timeInput.addEventListener('change', () => {
    startLoading();
    states.time = parseInt(timeInput.value);
    loadData();
})

const loadData = () => {
    $.ajax({
        'url': genURL(),
        "method": "GET"
    }).done((response) => {
        mytable.innerHTML = '';
        response.map(transition => {
            mytable.innerHTML += `<tr>
                            <td>${transition.createdAt}</td>
                            <td>${transition.user[0].username}</td>
                            <td>${transition.user[0].email}</td>
                            <td>${transition.cheakIn ? "True" : "False"}</td>
                            <td>${transition.amount}/-</td>
                            <td><button class="know_more_btn" onclick="more_details('${transition._id}')">More</button></td>
                        </tr>`
        })
        if (response.length === 0) {
            mytable.innerHTML = '<h1>No Data Found</h1>'
        }
    })
}

const startLoading = () => {
    mytable.innerHTML = `<div id="spinner" style="height:100px"
        class="show bg-white  start-50 d-flex align-items-center justify-content-center">
        <div class="spinner-border text-primary" style="width: 3rem; height: 3rem;" role="status">
            <span class="sr-only">Loading...</span>
        </div>
    </div>`
}

const genURL = () => {
    return `/filterdata?search=${states.search}&sort=${states.sort}&cheakIn=${states.cheakin}&time=${states.time}`
}

let ptimeout = 0;
const foo = () => {
    clearTimeout(ptimeout);
    ptimeout = setTimeout(() => {
        ptimeout = 0;
        loadData();
    }, 2000);
}

let popup = document.getElementById("popup");
let popupContent = document.querySelector(".popup-content");
let popContent = document.querySelector("#pop_content");
const more_details = (id) => {
    document.getElementById("popup").style.display = "block";
    popContent.innerHTML = `<div id="spinner" style="height:100px"
        class="show bg-white  start-50 d-flex align-items-center justify-content-center">
        <div class="spinner-border text-primary" style="width: 3rem; height: 3rem;" role="status">
            <span class="sr-only">Loading...</span>
        </div>
    </div>` 
    $.ajax({
        'url': `/loadTransition/${id}`,
        "method": "GET"
    }).done((response) => { 
        popContent.innerHTML = `
        <p class="data_values">Username: <span>${response.user.username}</span> </p>
                                    <p class="data_values">Email: <span>${response.user.email}</span> </p>
                                    <p class="data_values">Amount: <span>${response.amount}/-</span> </p>
                                    <p class="data_values">Discount: <span>${response.discount}/-</span> </p>
                                    <p class="data_values">Nights: <span>${response.nights} </span> </p>
                                    <p class="data_values">Rooms:<span>${response.rooms}</span> </p>
                                    <p class="data_values">Check In: <span>${response.cheakIn?"YES":"NO"}</span> </p>
                                    <p class="data_values">Time: <span>${response.createdAt}</span> </p>
                                    <p class="data_values">Payment Id: <span>${response.razorpay_payment_id}</span> </p>
                                    <p class="data_values">Order Id: <span>${response.razorpay_order_id}</span> </p>
                                    <p class="data_values">Signature:<span>${response.razorpay_signature}</span> </p>
        `
    })
}

const cheakBtnValid = (ele) => {
  let val = true;
    Array.from(document.getElementsByClassName('know_more_btn')).forEach(btn => {
        if (btn == ele) {
            val = false; 
        }
    });
    return val;
}

document.addEventListener("click", function (event) {
    if (!popupContent.contains(event.target) && cheakBtnValid(event.target)) {
        popup.style.display = "none";
    }
});

window.onload = () => {
    startLoading();
    loadData();
}