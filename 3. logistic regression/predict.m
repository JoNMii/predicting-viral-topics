function p = predict(theta, X)
% Predict for each X whether the label is 0 or 1 using learned
% logistic regression parameters theta, using a threshold at 0.5
% i.e., if sigmoid(theta'*x) >= 0.5, predict 1

m = size(X, 1); % Number of training examples

p = sigmoid(X * theta) >= 0.5;

end
