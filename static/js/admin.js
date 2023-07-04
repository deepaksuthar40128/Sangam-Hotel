window.onload = async () => {
    let data = await sendRequest();
    document.getElementById('total_users').innerHTML = data.users;
    document.getElementById('total_rooms').innerHTML = data.rooms;
    document.getElementById('total_coupons').innerHTML = data.coupons;
    document.getElementById('current_price').innerHTML = data.price;
}


const sendRequest = () => {
    return new Promise(async (Resolve, Reject) => {
        try {
            var request = {
                "url": '/adminInfo',
                "method": "GET"
            }
            $.ajax(request).done(function (response) {
                Resolve(response);
            })
        } catch (err) {
            Reject(err);
        }
    })
}

let price_form = document.getElementById('price_form');
price_form.addEventListener('submit', (e) => {
    e.preventDefault();
    price_form.submit_btn.innerText = 'Loading'
    let data = {
        newPrice: price_form.newPrice.value,
    }
    $.ajax({
        url: '/updatePrice',
        method: 'POST',
        data
    }).done((Price) => {
        let status = document.getElementById('error_success');
        if (Price.success) {
            status.style.background = 'green';
            status.style.padding = '10px'
            status.innerText = Price.msz
            document.getElementById('current_price').innerHTML = Price.amount;
        }
        else {
            status.innerText = Price.error
            status.style.background = 'red';
            status.style.padding = '10px'
        }
        price_form.newPrice.value = ''
        price_form.submit_btn.innerText = 'Update'
    })
})