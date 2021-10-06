var d = new Date();
var date = d.getHours()+ ':' + d.getMinutes() + '-' + d.getDate() + '.' + (d.getMonth()+1) + '.' + d.getFullYear()
console.log(date);

let userDB = [
    {
        "id": '243fds',
        "name": 'John',
        "lastname": 'Doe',
        "DoB": '25.6.1988',
        "location": {
            "city": "Oulu",
            "country": "Finland",
            "postalCode": "90160"
        }
    },
    {
        "id": '589sfd',
        "name": 'Joanne',
        "lastname": 'Smith',
        "DoB": '6.2.1993',
        "location": {
            "city": "Helsinki",
            "country": "Finland",
            "postalCode": "00100"
        }
    }
];
console.log("at first", userDB[0]);
console.log(userDB[1]);

var id = '243fds';
const user = userDB.find(userDB => userDB.id === id);
user.name = 'Josh';
console.log("modified",userDB[1]);
console.log("test", user.location.city);

const result = userDB.filter(f => f.location.city === "Helsinki");

console.log("Answer", result);
/*
function findLocation(city){
    return city == 'Oulu';
}

const result = userDB.filter(findLocation('Oulu'));

console.log("result ", result);
*/
console.log("value",userDB.indexOf(user));
//console.log(userDB.indexOf(id='243fds'))
if(user.id === undefined) {
    console.log("not found")
} else {
    userDB.splice(userDB.indexOf(user), 1);
    }
console.log(userDB)