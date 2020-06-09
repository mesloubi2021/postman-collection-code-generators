const codegen = require('postman-code-generators'),
    _ = require('lodash'),
    sdk = require('postman-collection'),
    async = require('async');

/**
 * Generates snippet for a function declaration

 * @param {String} requestSnippet - Request snippet generated by postman-code-generator
 * @param {Object} options - postman-code-gen options (for specific language)
 * @returns {String} - returns a snippet of function declaration of of a request
 */
function generateFunctionSnippet(requestSnippet, options) {
    var snippet = '';
    snippet += options.ES6_enabled ? '(callback) => {\n' : 'function(callback){\n';
    snippet += requestSnippet;
    snippet += '}';
    return snippet;
}

/**
 * Extracts requests and generats snipepts collection members
 * Algorithm used : Reccursive dfs function which uses promises to traverse the postman-collection

 * @param {Object} collectionItemMember - PostmanItem or PostmanItemGroup instance
 * @param {Object} options - postman-code-gen options (for specific language)
 * @param {Number} depth - Depth of the graph/tree(PostmanItem/PostmanItemGroup). Used to set proper indentation. 
 * @returns {Promise} - promise containing snippet for collection requests or error
 */
async function processCollection(collectionItemMember, options, depth) {
    var snippet = '',
        error;
    if (sdk.Item.isItem(collectionItemMember)) {
        codegen.convert('NodeJs', 'Request', collectionItemMember.request, options, function (err, requestSnippet) {
            if (err) {
                error = err;
                return;
            }
            snippet += `"${collectionItemMember.name}": `;
            snippet += generateFunctionSnippet(requestSnippet, options);
            snippet += ',\n';
        });
        return new Promise((resolve, reject) => {
            if (error) {
                reject(error);
            } else {
                resolve(snippet);
            }
        });
    }
    snippet = `"${collectionItemMember.name}": {\n`;
    const collItemMemberPromises = collectionItemMember.items.members.map((element) => {
        return processCollection(element, options, depth + 1)
            .then((itemSnippet) => {
                snippet += itemSnippet;
            })
            .catch((err) => {
                error = err;
            });
    });
    await Promise.all(collItemMemberPromises);
    snippet += '},\n';
    return new Promise((resolve, reject) => {
        if (error) {
            reject(error);
        } else {
            resolve(snippet);
        }
    });
}

module.exports = {
    generateFunctionSnippet,
    processCollection,
};