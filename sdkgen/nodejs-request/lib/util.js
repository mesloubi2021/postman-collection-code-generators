const codegen = require('postman-code-generators'),
  sdk = require('postman-collection');

/**
 * [Description]
 *
 * @param {String} requestSnippet - Request snipept generated by postman-code-generator
 * @returns {String} - Request snippet string with replaced collection variables
 */
function replaceVariables (requestSnippet) {
  var variableDeclarations = requestSnippet.match(/{{[^{\s\n}]*}}/g);
  if (variableDeclarations) {
    variableDeclarations.forEach((element) => {
      // replacing {{variable_name}} with ' + this.variables.variable_name + '
      requestSnippet = requestSnippet.replace(element, '\' + ' + element.substring(2, element.length - 2) + ' + \'');
    });
  }
  return requestSnippet;
}

/**
 * Generates snippet for a function declaration

 * @param {String} requestSnippet - Request snippet generated by postman-code-generator
 * @param {Object} options - postman-code-gen options (for specific language)
 * @returns {String} - returns a snippet of function declaration of of a request
 */
function generateFunctionSnippet (requestSnippet, options) {
  var snippet = '',
    variableDeclarations = requestSnippet.match(/{{[^{\s\n}]*}}/g);
  snippet += options.ES6_enabled ? '(variables, callback) => {\n' : 'function(variables, callback){\n';
  variableDeclarations.forEach((element) => {
    var varName = element.substring(2, element.length - 2);
    snippet += `let ${varName} = variables.${varName} ? variables.${varName} : self.variables.${varName};\n`;
  });
  snippet += replaceVariables(requestSnippet);
  // snippet += requestSnippet;
  snippet += '}';
  return snippet;
}

/**
 * Extracts requests and generats snipepts collection members
 * Algorithm used : Reccursive dfs function which uses promises to traverse the postman-collection

 * @param {Object} collectionItemMember - PostmanItem or PostmanItemGroup instance
 * @param {Object} options - postman-code-gen options (for specific language)
 * @param {Functionn} callback - Callback function to return response (err, snippet)
 * @returns {Promise} - promise containing snippet for collection requests or error
 * TODO fix issue with indent
 */
function processCollection (collectionItemMember, options, callback) {
  var snippet = '',
    error = null;
  if (sdk.Item.isItem(collectionItemMember)) {
    codegen.convert('NodeJs', 'Request', collectionItemMember.request, options, function (err, requestSnippet) {
      if (err) {
        error = err;
        return;
      }
      snippet += `"${collectionItemMember.name}": \n`;
      snippet += `/**\n${collectionItemMember.request.description}\n*/\n`;
      snippet += generateFunctionSnippet(requestSnippet, options);
      snippet += ',\n';
    });
    return callback(error, snippet);
  }
  snippet = `"${collectionItemMember.name}": {\n`;
  snippet += `/**\n${collectionItemMember.description}\n*/\n`;
  collectionItemMember.items.members.forEach((element) => {
    processCollection(element, options, (err, snippetr) => {
      if (err) {
        return callback(err, null);
      }
      snippet += snippetr;
    });
  });
  snippet += '},\n';
  return callback(error, snippet);
}

module.exports = {
  generateFunctionSnippet,
  processCollection,
  replaceVariables
};
