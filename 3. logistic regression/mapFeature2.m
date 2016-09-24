function out = mapFeature2(X1, X2)
% Maps the two input features to quadratic features used
% with regularization technique.
%
% Returns a new feature array with more features, comprising of 
% X1, X2, X1.^2, X2.^2, X1*X2, X1*X2.^2, etc..
%
% Inputs X1, X2 must be of the same size


degree = 6; % max degree (increasing it further may lead to overfitting)

out = ones(size(X1(:, 1)));
for i = 1:degree
    for j = 0:i
        out(:, end+1) = (X1 .^ (i-j)) .* (X2 .^ j);
    end
end

end