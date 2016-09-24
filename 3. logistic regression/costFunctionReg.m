function [J, grad] = costFunctionReg(theta, X, y, lambda)
% Computes the cost of using theta as the parameter for
% regularized logistic regression and the gradient of the cost
% w.r.t. to the parameters.

m = length(y); % number of training examples

J = 0; % value of the cost function
grad = zeros(size(theta)); % gradient - has the same dimensions as theta

% Compute the partial derivatives and set grad to the partial
% derivatives of the cost w.r.t. each parameter in theta
h = sigmoid(X * theta);
k = size(theta);

J = (1 / m) * (-y' * log(sigmoid(X * theta)) - (1 - y') * log(1 - sigmoid(X * theta)));
J = J + (lambda / (2 * m)) * sum(theta(2 : k) .^ 2);

grad = (1 / m) * (sigmoid(X * theta) - y)' * X;
grad(2 : k) = grad(2 : k) + lambda / m * theta(2 : k)';

end
