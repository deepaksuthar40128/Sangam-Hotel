const { passwordStrength } = require('check-password-strength')

module.exports.myPasswordPower = (password) => {
    let data = passwordStrength(password);
    if (data.length < 8) {
        return {
            success: false,
            error:"Password length should be atleast 8"
        };
    }
    else if (data.contains.length < 4) {
        if (!data.contains.includes('lowercase')) {
            return {
                success: false,
                error: "Password should contain a lowercase (a,b,c...) letter"
            };
        }
        else if (!data.contains.includes('uppercase')) { 
            return {
                success: false,
                error: "Password should contain a Uppercase (A,B,C...) letter"
            };
        }
        else if (!data.contains.includes('number')) {
            return {
                success: false,
                error: "Password should contain a Number (1,2,3...)"
            };
        }
        else {
            return {
                success: false,
                error: "Password should contain a symbol(@,#,*...)"
            };
        }
    }
    else return {
        success: true,
        error: null
    };
}