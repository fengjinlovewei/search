// Calculate a rolling hash.
// const crypto = require('crypto');
// const hash = crypto.createHash('sha256');

// hash.update('one');
// console.log(hash.digest('hex'));

// hash.update('two');
// console.log(hash.digest('hex'));

// hash.update('three');
// console.log(hash.digest('hex'));
var hash = require('object-hash');

var hash = require('object-hash');

var peter = {
  name: 'Peter',
  stapler: false,
  friends: ['Joanna', 'Michael', 'Samir'],
};
var michael = { name: 'Michael', stapler: false, friends: ['Peter', 'Samir'] };
var bob = { name: 'Bob', stapler: true, friends: [] };

/***
 * sha1 hex encoding (default)
 */
console.log(hash.keysMD5(peter));
// 14fa461bf4b98155e82adc86532938553b4d33a9
console.log(hash.keysMD5(michael));
// 4b2b30e27699979ce46714253bc2213010db039c
console.log(hash.keysMD5(bob));
// 38d96106bc8ef3d8bd369b99bb6972702c9826d5
console.log(hash('dddddd'));
console.log(hash.MD5('dddddd'));
