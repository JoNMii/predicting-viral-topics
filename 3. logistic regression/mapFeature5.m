function out = mapFeature5(X1, X2, X3, X4, X5)
% Maps the three input features to cubic features used
% with regularization technique.
%
% Returns a new feature array with more features, 
% similarly to mapFeature2 and mapFeature3
%
% Inputs X1, X2, X3, X4, X5 must be of the same size

degree = 6; % max degree (increasing it further may lead to overfitting)

out = ones(size(X1(:,1)));
for i1 = 1:degree
    for i2 = 0:i1
        for i3 = 0:i2
            for i4 = 0:i3
                for i5 = 0:i4
                    out(:, end+1) = (X1.^(i3-(i4+i5))).*(X2.^(i4-i5)) .*(X3.^i5);
                end
            end
        end
    end
end

end