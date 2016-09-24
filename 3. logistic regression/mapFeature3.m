function out = mapFeature3(X1, X2, X3)
% Maps the three input features to cubic features used
% with regularization technique.
%
% Returns a new feature array with more features, 
% similarly to mapFeature2
%
% Inputs X1, X2, X3 must be of the same size

degree = 6; % max degree (increasing it further may lead to overfitting)

out = ones(size(X1(:,1)));
for i = 1:degree
    for j = 0:i
        for k = 0:j
            out(:, end+1) = (X1.^(i-j+k)).*(X2.^(j-k)) .*(X3.^k);
        end
    end
end

end