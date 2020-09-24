document.addEventListener('DOMContentLoaded', function() {
    const entryNumber = document.getElementById('entry-number');
    const memNumber = document.getElementById('mem-number');
    const keys = document.getElementById('keys');
    
    let isAnswer = false;
    let isPrefix = false;
    let brackets = 0;

    keys.addEventListener("mousedown", (event) => {
        const key = event.target.textContent;
        const keyData = event.target.getAttribute('data-calc');
        
        if (!isNaN(key)) 
            entryNumber.value = entryNumber.value === '0' ? key : entryNumber.value + key;
           
        switch (keyData) {            
            case 'main-arithmetic':
                if (isAnswer) {
                    memNumber.value = '';
                    isAnswer = false;    
                }    
                if (memNumber.value.slice(-1) === ')' || isPrefix) {
                    memNumber.value += key;                      
                    isPrefix = false;
                } else
                    memNumber.value += entryNumber.value + key;                            
                entryNumber.value = '0';            
                break;
            case 'function':
                if (isAnswer) {
                    memNumber.value = '';
                    isAnswer = false;    
                }
    
                isPrefix = true;
                            
                if (key === '√' && entryNumber.value === '0')
                    memNumber.value += key;
                else if (key === 'n!')
                    memNumber.value += entryNumber.value + '!';
                else
                    memNumber.value += key === 'log2' ? 'log' + entryNumber.value : key + entryNumber.value;                        
                entryNumber.value = '0';
                break;
            case 'equal':
                if (!isAnswer) {
                    memNumber.value += (entryNumber.value !== '0') ? entryNumber.value : '';
                    const npr = infixNotationToRPN(memNumber.value)
                    const res = computeRPN(npr);
                    if (res === null)
                        entryNumber.value = 'My life is ERROR';
                    else if (isNaN(res))
                        entryNumber.value = 'It\'s impossible!';
                    else
                        entryNumber.value = res.toString();                
                    isAnswer = true;
                }
                break;
            case 'const':
                entryNumber.value = key;
                break;
            case 'bracket':
                if (key === '(') {
                    brackets++; 
                    memNumber.value += key;                        
                } else {
                    if (brackets > 0 && memNumber.value.slice(-1) !== ')') {
                        brackets--;
                        memNumber.value += entryNumber.value + key;
                    }                
                }                           
                entryNumber.value = '0'; 
                break;
            default:
                break;
        }
               
        switch (key) {
            case 'CE':
                entryNumber.value = '0';
                break;
            case 'C':
                entryNumber.value = '0';
                memNumber.value = '';
                break;
            case '⌫':                
                const n = entryNumber.value.includes('-') ? 2 : 1;
                entryNumber.value = entryNumber.value.length > n ? entryNumber.value.slice(0, -1) : '0';
                break;
            case '.':
                if (!entryNumber.value.includes('.'))
                    entryNumber.value += key;
                break;
            case '±':
                entryNumber.value = !entryNumber.value.includes('-') ? `-${entryNumber.value}` : entryNumber.value.slice(1);
                break; 
            case 'xⁿ':
                if (memNumber.value.slice(-1) !== ')') {
                    memNumber.value += entryNumber.value + '^';                        
                    entryNumber.value = '0';
                } else memNumber.value += '^'; 
                break;           
            default:
                return;        
        }
    });
}, false);

/***************************************************************/
/*                  Calculator Engine                          */
/*                GNU GPL v.3 Archylex                         */
/***************************************************************/

/*   Arithmetic operations   */

const factorial = n => n ? n * factorial(n - 1) : 1;

const fraction = (a, b) => {
    a = isNaN(a) || !isFinite(a) || a == '0' ? '0.0' : a.toString();
    b = isNaN(b) || !isFinite(b) || b == '0' ? '0.0' : b.toString();

    let [intA, decA] = a.split('.');
    let [intB, decB] = b.split('.');        

    if (decA === undefined) decA = '';     
    if (decB === undefined) decB = '';

    const x = Math.pow(10, decA.length);
    const y = Math.pow(10, decB.length);
    const signA = a.slice(0, 1) === '-' ? -1 : 1;
    const signB = b.slice(0, 1) === '-' ? -1 : 1;

    return ((Number(intA) * signA * x + Number(decA)) * y * signA + (Number(intB) * signB * y + Number(decB)) * x * signB) / x / y; 
}

const clearArray = a => a.filter(e => e != null && e !== '' && e !== ' ');

/*
    Produce reverse polish notation from infix notation
    https://en.wikipedia.org/wiki/Reverse_Polish_notation

    Shunting Yard is a method for parsing mathematical expressions specified in infix notation
    https://en.wikipedia.org/wiki/Shunting-yard_algorithm

*/

const infixNotationToRPN = expression => {
    let output = '';
    let stack = [];
    let operators = {            
        '^': {
            precedence: 4,
            associativity: 'right'
        },
        '√': {
            precedence: 4,
            associativity: 'left'
        },     
        'lg': {
            precedence: 4,
            associativity: 'left'
        },  
        'log': {
            precedence: 4,
            associativity: 'left'
        }, 
        'ln': {
            precedence: 4,
            associativity: 'left'
        }, 
        '!': {
            precedence: 4,
            associativity: 'left'
        },
        'sin': {
            precedence: 4,
            associativity: 'left'
        }, 
        'cos': {
            precedence: 4,
            associativity: 'left'
        }, 
        'tan': {
            precedence: 4,
            associativity: 'left'
        },     
        '×': {
            precedence: 3,
            associativity: 'left'
        },
        '÷': {
            precedence: 3,
            associativity: 'left'
        },            
        '+': {
            precedence: 2,
            associativity: 'left'
        },
        '−': {
            precedence: 2,
            associativity: 'left'
        }
    }

    expression = clearArray(expression.split(/([\+−×÷√πeγφ\^\(\)]|log|lg|ln|sin|cos|tan|!)/));
    
    expression.forEach( token => {                        
        const sign = '!^×÷+−√lnlglogsincostan';

        token = token === 'π' ? Math.PI : token; // Archimedes' constant
        token = token === 'e' ? Math.E : token; // Euler's number
        token = token === 'φ' ? 1.61803398874989 : token; // Golden ratio
        token = token === 'γ' ? 0.57721566490153 : token; // Euler–Mascheroni constant

        if (!isNaN(Number(token)) && isFinite(token))
            output += token + ' ';
        else if (sign.indexOf(token) !== -1) {
            let tmp = stack[stack.length - 1];                
            while(sign.indexOf(tmp) !== -1 && ((operators[token].associativity === 'left' && operators[token].precedence <= operators[tmp].precedence) || (operators[token].associativity === 'right' && operators[token].precedence < operators[tmp].precedence))) {
                output += stack.pop() + ' ';
                tmp = stack[stack.length - 1];
            }
            stack.push(token);
        } else if (token === '(') 
            stack.push(token);
        else if (token === ')') {
            while (stack[stack.length - 1] !== '(')
                output += stack.pop() + ' ';                
            stack.pop();
        }
    });

    while (stack.length > 0) 
        output += stack.pop() + ' ';

    return output;
}

/*   Compute reverse polish notation   */

const computeRPN = exp => {
    let stack = [];
    exp = clearArray(exp.split(' '));
    
    if(exp.length === 0) return 0;

    for (let i = 0; i < exp.length; i++) {
        if (!isNaN(exp[i]) && isFinite(exp[i]))
            stack.push(exp[i]);
        else {
            let a = stack.pop();
            let b;

            if (!isFinite(a) || isNaN(a)) 
                return NaN;

            if ('!√lgloglnsincostan'.indexOf(exp[i]) === -1)
                b = stack.pop();
                            
            switch (exp[i]) {
                case '+':                        
                    stack.push(fraction(a, b));
                    break;
                case '−':                    
                    a = a.toString().slice(0, 1) === '-' || 0 ? a.slice(1) : `-${a}`;
                    stack.push(fraction(a, b));
                    break;
                case '×':
                    stack.push(Number(a) * Number(b));
                    break;
                case '÷':
                    stack.push(Number(b) / Number(a));
                    break;
                case '^':
                    stack.push(Math.pow(Number(b), Number(a)));
                    break;
                case 'sin': 
                    stack.push(Number(Math.sin(Number(a) / 180 * Math.PI).toFixed(15).toString()));
                    break;
                case 'cos':
                    stack.push(Number(Math.cos(Number(a) / 180 * Math.PI).toFixed(15).toString()));
                    break;
                case 'tan':
                    stack.push(Number(Math.tan(Number(a) / 180 * Math.PI).toFixed(15).toString()));
                    break;
                case 'ln':
                    stack.push(Math.log(Number(a)));
                    break;
                case 'log':
                    stack.push(Math.log2(Number(a)));
                    break;
                case 'lg':
                    stack.push(Math.log10(Number(a)));
                    break;
                case '√':
                    stack.push(Math.sqrt(Number(a)));
                    break;
                case '!':
                    stack.push(factorial(Number(a)));
                    break;
            }                
        }
    }

    return stack.length > 1 ? null : stack[0];  
}
