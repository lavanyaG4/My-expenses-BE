// console.log(a);
// const a = 10;

// sayHello();
// function sayHello() {
//     console.log("Hello");
// }

// function createApiClient(baseUrl) {
//     return function(endpoint) {
//         return console.log(baseUrl + endpoint);
//     };
// }

//     const userApi = createApiClient("https://www.google.com");

// userApi("/search");
// userApi("/search?q=javascript");

// const promise = new Promise((resolve, reject) => {
//     setTimeout(() => {
//         resolve("Success");
//     }, 3000);
// });

// promise.then(result => {
//     console.log(result);
// });

// async function test() {
//     return "Hello";
// }
// console.log(await test());
// console.log("A");

// setTimeout(() => {
//     console.log("B");
// }, 0);

// Promise.resolve().then(() => {
//     console.log("C");
// });

// console.log("D");
// function counter() {
//     let count = 0;

//     return function () {
//         count++;
//         return count;
//     };
// }

// const c1 = counter();
// const c2 = counter();

// console.log(c1());
// console.log(c1());
// console.log(c2());
// console.log(c2());
async function test() {
  console.log("A");

  await Promise.resolve();

  console.log("B");

  setTimeout(() => {
    console.log("C");
  }, 0);
}

console.log("D");

test();

console.log("E");