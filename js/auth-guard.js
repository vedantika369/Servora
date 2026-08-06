import {

auth,
db

}

from "./firebase-config.js";



import {

onAuthStateChanged

}

from
"https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";



import {

ref,
get

}

from
"https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";






export function checkRole(requiredRole, redirectPage){





onAuthStateChanged(auth, async(user)=>{





if(!user){


window.location.href = redirectPage;


return;


}







try {



const userRef =

ref(

db,

"users/" + user.uid

);







const snapshot =

await get(userRef);







if(snapshot.exists()){



const userData =

snapshot.val();







if(userData.role !== requiredRole){



window.location.href = redirectPage;


}



}



else{



window.location.href = redirectPage;



}



}



catch(error){


console.error(
"Role checking error:",
error
);


window.location.href = redirectPage;


}




});



}