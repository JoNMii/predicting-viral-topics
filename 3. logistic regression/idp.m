% Inspired by practical exercises on Coursera: https://www.coursera.org/learn/machine-learning
%
% Author:       Eric Gopak
% Affiliation:  Technische Universität München
% Last updated: 23.09.2016

% Initialization
clear ; close all; clc

% ==================== Load data ====================
% The first five columns contain the readability scores and the last
% column contains the number of Facebook shares

data = load('idp_data.txt');
% X - input data   y - output data
% Choose [i, j], 1 <= i < j <= 5 for indices of X depending
% on your goals. [1, 5] means to use all the input data
% i.e. 5 input variables, for calculating pentanomial regression
X = data(:, 1:5);
% X = data(:, [2, 3]);
% X = data(:, [1, 2, 4]);
% X = data(:, [2, 3, 5]);

y = data(:, 6);
% For logistic regression only:
%     convert y into binary categories
% threshold = 100; % number of FB shares - threshold
% y = y >= threshold; % below the threshold - 0, otherwise 1

ctr = 0;
err = [];

% Optionally: try out all possible subsets of input vectors
% output total number of errors, see for yourself which
% of the logistic regressions work the best
for i = 1:5
    c = combnk(1:5, i); % all combinations of size i
    for j = 1:size(c,1)
        ctr = ctr + 1;
        X = data(:, c(j,:));  % select input vectors
        b = mnrfit(X, y + 1); % get matrix b
        g = mnrval(b, X);     % use b for prediction
        p = g(:,1) <= g(:,2); % map predictions to the same boolean 
                                categories
        disp([ctr c(j,:)]);
        err = [err; sum(p ~= y) ctr]; % accumulate errors for later analysis
        tmp = y(p ~= y);
        disp(tmp(1:10));
        fprintf('\n %s \n', tmp);
    end
    X = data(:, c);
    b = mnrfit(X, y + 1);
    g = mnrval(b, X);
    r = g(:, 1) > g(:, 2);
    disp([ sum(r)]);
end
% investigate prediction errors
% disp(err);
% mn = err(err(:,1) == min(err(:,1)), :)


% ==================== Plotting ====================
% Plotting can help understand the data
% Note: Only works with 2, 3 or 5 dimensions (input variables),
% see further comments for details. Feel free to adapt the code
% for any number of dimensions
% 

figure; hold on;

% Use this in case of 2 input variables
% fprintf(['Plotting data with + indicating (y = 1) examples and o indicating (y = 0) examples.\n']);
% plotData2(X, y);

% Use this in case of 3 input variables
% fprintf(['Plotting data with + indicating (y = 1) examples and o indicating (y = 0) examples.\n']);
% plotData3(X, y)

% Use this in case of 5 input variables
% scatter(X(:,1), y, 10, 'ro');
% scatter(X(:,2), y, 10, 'go');
% scatter(X(:,3), y, 10, 'bo');
% scatter(X(:,4), y, 10, 'mo');
% scatter(X(:,5), y, 10, 'bo');
% 
% xlabel('Readability score')
% ylabel('Facebook shares')
% 
% Specified in the same order as they are plotted
% legend('Flesch-Kincaid Reading Ease', 'Flesch-Kincaid Grade Level', 'Coleman-Liau Index', 'SMOG Index', 'Automated Readability Index')

hold off;

% Pause and let yourself contemplate the magnificence of what you see
% fprintf('\nProgram paused. Press enter to continue.\n');
% pause;


% ==================== Compute Cost and Gradient ====================
% Logistic regression

%  Setup the data matrix appropriately, and add ones for the intercept term
[m, n] = size(X);

% Add Polynomial Features
% Note: mapFeatureX also adds a column of ones for us, so the intercept
% term is handled
% X = mapFeature2(X(:,1), X(:,2));
% X = mapFeature3(X(:,1), X(:,2), X(:,3));
X = mapFeature5(X(:,1), X(:,2), X(:,3), X(:,4), X(:,5));

% Initialize fitting parameters
initial_theta = zeros(size(X, 2), 1);

lambda = 1; % regularization parameter

% Compute and display initial cost and gradient
[cost, grad] = costFunctionReg(initial_theta, X, y, lambda);

fprintf('Cost at initial theta (zeros): %f\n', cost);

fprintf('\nProgram paused. Press enter to continue.\n');
pause;

% ============= Regularization =============
% Set Options
options = optimset('GradObj', 'on', 'MaxIter', 400);

% Optimize
[theta, J, exit_flag] = ...
    fminunc(@(t)(costFunctionReg(t, X, y, lambda)), initial_theta, options);

% ============= Plot Boundary =============
% Optional: only works in case of 2 dimensions (input variables)
% plotDecisionBoundary(theta, X, y);
% hold on;
% title(sprintf('lambda = %g', lambda))
% 
% legend('y = 1', 'y = 0', 'Decision boundary')
% hold off;

% ============= Prediction & Accuracy =============
% Compute accuracy on our training set
p = predict(theta, X);

fprintf('Train Accuracy: %f\n', mean(double(p == y)) * 100);
