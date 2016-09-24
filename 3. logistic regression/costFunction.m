function [J, grad] = costFunction(theta, X, y)
% Computes the cost of using theta as the parameter for
% logistic regression and the gradient of the cost
% w.r.t. to the parameters.

m = length(y); % number of training examples

J = 0; % value of the cost function
grad = zeros(size(theta)); % gradient - has the same dimensions as theta

% Compute the partial derivatives and set grad to the partial
% derivatives of the cost w.r.t. each parameter in theta

J = (1 / m) * (-y' * log(sigmoid(X * theta)) - (1 - y') * log(1 - sigmoid(X * theta)));

grad = (1 / m) * (sigmoid(X * theta) - y)' * X;

end
