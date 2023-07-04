let slide_img = document.getElementById('slide_img');
let slider = document.getElementById('slider');
let room_amount = document.getElementById('room_amount').value;
let total_night_count = 1, total_room_count = 1;
let finalAmount = 0, discount_amount = 0;
let discount = {
    amount: 0,
    type: ""
}
let photos = [
    "img/rooms/f1.jpeg",
    "img/rooms/f62.jpeg",
    "img/rooms/f3.jpeg",
    "img/rooms/f4.jpeg",
    "img/rooms/f5.jpeg",
    "img/rooms/f2.jpeg",
]
let slideNumber = -1;
const setOpen = (val, num) => {
    slideNumber = num;
    if (val) {

        slider.style.display = 'flex'
        enterFullScreen(slider)
        slide_img.src = photos[num]
    }
    else {
        exitFullscreen();
        slider.style.display = 'none'

    }
}
const handleOpen = (i) => {
    setOpen(true, i);
};
const handleMove = (direction) => {
    let newSlideNumber;
    if (direction == "l") {
        newSlideNumber = slideNumber === 0 ? photos.length - 1 : slideNumber - 1;
    } else {
        newSlideNumber = slideNumber === photos.length - 1 ? 0 : slideNumber + 1;
    }
    setOpen(true, newSlideNumber);

};
function enterFullScreen(element) {
    if (element.requestFullscreen) {
        element.requestFullscreen();
    } else if (element.mozRequestFullScreen) {
        element.mozRequestFullScreen();     // Firefox
    } else if (element.webkitRequestFullscreen) {
        element.webkitRequestFullscreen();  // Safari
    } else if (element.msRequestFullscreen) {
        element.msRequestFullscreen();      // IE/Edge
    }
};
function exitFullscreen() {
    if (document.exitFullscreen) {
        document.exitFullscreen();
    } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
    }
};

let total_bill_ele = document.getElementById('totalbill');
function processBill() {
    total_bill_ele.style.display = 'block';
    update_bill();
    let prev_btn = document.getElementById('actionBtn').children[7];
    prev_btn.removeAttribute("onclick");
    prev_btn.setAttribute("id", "rzp-button1");
    prev_btn.innerText = "Pay"
    document.getElementById('rzp-button1').onclick = startPayment;
}

const startPayment = async (e) => {
    e.preventDefault();
    e.target.innerHTML = '<div class="loading_circle"><i class="fas fa-spinner"></i></div>'
    e.target.setAttribute('disabled', true)
    let res = await sendRequest();
    if (res.success) {
        var options = {
            "key": "rzp_test_5rQk2BM28AQkwo",
            "amount": res.amount,
            "currency": "INR",
            "name": "H.P.Tower",
            "description": `Amount for Booking for ${res.nights} nights`,
            "order_id": res.order.id,
            "callback_url": `${window.location.origin}/cheak`,
            "prefill": {
                "name": document.getElementById('username').innerText,
                "email": document.getElementById('email').innerText
            },
            "notes": {
                "address": "Razorpay Corporate Office"
            },
            "theme": {
                "color": "#3399cc"
            }
        };
        var rzp1 = new Razorpay(options);
        rzp1.open();
        setTimeout(() => {
            e.target.innerHTML = 'Pay'
            e.target.removeAttribute("disabled")
        }, 2000);
        rzp1.on('payment.failed', function (response) {
            alert("Payment Failed");
            e.target.innerHTML = 'Pay'
            e.target.removeAttribute("disabled")
            location.reload();
        });
        rzp1.on('payment.rejected', function (response) {
            alert("payment Rejected");
            e.target.innerHTML = 'Pay'
            e.target.removeAttribute("disabled")
            location.reload();
        })
        rzp1.on('payment.pending', function (response) {
            alert("Payment Rejected");
            e.target.innerHTML = 'Pay'
            e.target.removeAttribute("disabled")
            location.reload();
        })

    } else {
        alert("Something went Wrong");
        e.target.innerHTML = 'Pay'
        e.target.removeAttribute("disabled")
    }
}

const sendRequest = () => {
    return new Promise(async (Resolve, Reject) => {
        try {
            var request = {
                "url": '/makePayment',
                "method": "POST",
                "data": {
                    amount: finalAmount,
                    nights: total_night_count,
                    discount: discount_amount,
                    rooms: total_room_count
                }
            }
            $.ajax(request).done(function (response) {
                Resolve(response);
            })
        } catch (err) {
            // console.log(err);
            Reject(err);
        }
    })
}

const calculate_discount = () => {
    let intital_value = total_night_count * room_amount * total_room_count;
    if (discount.type == "percent") {
        let dis_amount = (intital_value * discount.amount) / 100;
        discount_amount = dis_amount;
    } else {
        discount_amount = discount.amount;
    }
}

const update_bill = () => {
    calculate_discount();
    total_bill_ele.children[1].children[0].innerHTML = total_night_count;
    total_bill_ele.children[2].children[0].innerHTML = total_room_count;
    total_bill_ele.children[3].children[0].innerHTML = total_night_count * room_amount * total_room_count;
    total_bill_ele.children[4].children[0].innerHTML = discount_amount;
    total_bill_ele.children[5].children[0].innerHTML = ((total_night_count * room_amount * total_room_count - discount_amount) * 12) / 100;
    total_bill_ele.children[6].children[0].innerHTML = ((total_night_count * room_amount * total_room_count - discount_amount) * 112) / 100;
    total_bill_ele.children[7].children[0].innerHTML = Math.floor(((total_night_count * room_amount * total_room_count - discount_amount) * 112) / 100);
    finalAmount = Math.floor(((total_night_count * room_amount * total_room_count - discount_amount) * 112) / 100);
}

let input_counter1 = document.getElementsByClassName('input-counter')[0];
let input_counter2 = document.getElementsByClassName('input-counter')[1];

input_counter1.children[0].addEventListener('click', () => {
    if (input_counter1.children[1].value > 1) {
        input_counter1.children[1].value--;
        total_night_count--;
        update_bill();
    }
})
input_counter1.children[2].addEventListener('click', () => {

    input_counter1.children[1].value++;
    total_night_count++;
    update_bill();

})
input_counter2.children[0].addEventListener('click', () => {
    if (input_counter2.children[1].value > 1) {
        input_counter2.children[1].value--;
        total_room_count--;
        update_bill();
    }
})
input_counter2.children[2].addEventListener('click', () => {
    input_counter2.children[1].value++;
    total_room_count++;
    update_bill();
})



document.getElementById("openPopupButton").addEventListener("click", function () {
    document.getElementById("popup").style.display = "block";
})

let openPopupButton = document.getElementById("openPopupButton");
let popup = document.getElementById("popup");
let popupContent = document.querySelector(".popup-content");
let coupon_btn = document.getElementById('coupon_btn');
document.addEventListener("click", function (event) {
    if (!popupContent.contains(event.target) && event.target !== openPopupButton) {
        popup.style.display = "none";
    }
});
document.getElementById('coupon_form').addEventListener('submit', async (e) => {
    e.preventDefault();
    coupon_btn.innerHTML = 'Loading...';
    let coupon = document.getElementById('coupon');
    if (coupon.value) {
        var request = {
            "url": '/verifyCoupon',
            "method": "POST",
            "data": { coupon: coupon.value }
        }
        $.ajax(request).done(function (response) {
            let status = document.getElementById('error_success');
            if (!response.success) {
                status.innerText = 'Invalid Coupon!'
                status.style.background = 'red';
                status.style.padding = '10px'
            }
            else {
                discount.amount = response.discount;
                discount.type = response.discount_type;
                update_bill();
                status.style.background = 'green';
                status.style.padding = '10px'
                if (response.discount_type == "percent")
                    status.innerText = `Congratulation! You got discount of ${response.discount}%`
                else
                    status.innerText = `Congratulation! You got discount of ${response.discount}/-`
                openPopupButton.innerText = "Use Another Coupon"
            }
            coupon_btn.innerHTML = 'Verify'
        })
    }
}) 
