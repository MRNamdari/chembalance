# ChemBalance: A Dynamic Chemical Equation Balancer

This repository contains the source code for ChemBalance, a web application built with vanilla JavaScript (TypeScript) that allows users to dynamically balance chemical equations in a fun calculator-like environment.


you can play with it [here](https://chembalance.pages.dev).

## Help & Shortcuts

|Shortcut	|Description				 |
|:-------------:|----------------------------------------|
|⇧ + 0		|Clear all elements (AC)		 |
|⇧ + 1		|Compute the balanced equation		 |
|⇧ + 2		|Copy the balanced equation to clipboard |
|↑ or ↓		|Move a selected element vertically	 |


Some Keys function differently wheter the focus is on table or on console.

|key		|Table			    |Console				|
|:-------------:|---------------------------|-----------------------------------|
|Enter		|Add selected element	    |Compute balanced equation	 	|
|← or →		|Move element left or right |Move cursor left or right		|


## Chemical Equation Formatting:

1. Formulae and elements are enclosed within brackets: `[]`.

Example: 
```matlab
[H O*2]
```
2. Multiplication is denoted using `*`.

Examples: 
```matlab
[Cl*2] [Al [O H]*3]
```
3. Charges are indicated using `^`.

Example: 
```matlab
[O H]^-1
```
4. Equations are constructed using `+` (reactants) and `⇒` (products).

Example: 
```matlab
[2*Al [S O*3]*3]+[Na O H]⇒[Na*2 S O*3]+[Al [O H]*3]
```
5. Free electrons are represented using `-`.

Example: 
```matlab
[H*2 O]+[Mn O*4]^-1-1⇒[Mn O*2]+[O H]^-1
```
6. Setting a default coefficient on a formula:

Example: 
```matlab
[H*2]+1*[O*2]⇒[H*2 O]
```