## Question
For positive integer $n$, define $S_n$ to be the minimum value of the sum \[ \sum_{k=1}^n \sqrt{(2k-1)^2+a_k^2}, \] where $a_1,a_2,\ldots,a_n$ are positive real numbers whose sum is 17. There is a unique positive integer $n$ for which $S_n$ is also an integer. Find this $n$.

## Response
<think>
Alright, so I'm trying to solve this problem where I need to find a positive integer \( n \) such that \( S_n \), the minimum value of the sum \( \sum_{k=1}^n \sqrt{(2k-1)^2 + a_k^2} \), is an integer. Here, \( a_1, a_2, \ldots, a_n \) are positive real numbers that add up to 17.

Hmm, okay, let me break this down. I know that when you have a sum of square roots like this, it often relates to geometry, maybe minimizing distances. It reminds me of the problem where you have to break up a path into segments with certain slopes to minimize total distance. Maybe this is similar to finding the shortest path in a staircase.

Let me visualize it. Each term \( \sqrt{(2k - 1)^2 + a_k^2} \) looks like the hypotenuse of a right-angled triangle with legs \( (2k - 1) \) and \( a_k \). So, if I imagine a grid where I move horizontally by \( a_k \) and vertically by \( (2k - 1) \) for each step \( k \), then \( S_n \) would be the total length of this path.

Now, the sum of all \( a_k \) is 17, which would be the total horizontal distance. I need to figure out the vertical distances, which are fixed based on \( k \). So the total vertical distance would be \( \sum_{k=1}^n (2k - 1) \). Let me compute that:

The sum \( \sum_{k=1}^n (2k - 1) \) is equal to \( 2 \sum_{k=1}^n k - \sum_{k=1}^n 1 = 2 \cdot \frac{n(n + 1)}{2} - n = n(n + 1) - n = n^2 \). So the total vertical distance is \( n^2 \).

Wait a second, so this entire setup is like moving from the origin to the point \( (17, n^2) \) with \( n \) segments. Each segment has a horizontal component \( a_k \) and a vertical component \( (2k - 1) \). But in reality, this entire path from \( (0, 0) \) to \( (17, n^2) \) can be considered as a single straight line if we could somehow combine all these segments.

But we can't change the number of segments \( n \); each segment's vertical component is fixed. However, the horizontal components \( a_k \) can be adjusted as long as their sum is 17. So, to find the minimal total distance, maybe we can think of it as if each segment is contributing to the total path optimally. If we scale each horizontal component \( a_k \) proportionally, maybe this also corresponds to scaling the vertical components.

Alternatively, I can think of calculus optimization techniques. If I need to minimize the sum \( \sum_{k=1}^n \sqrt{(2k - 1)^2 + a_k^2} \) subject to \( \sum_{k=1}^n a_k = 17 \), I can use the method of Lagrange multipliers.

Let me set up the Lagrangian. Let \( L = \sum_{k=1}^n \sqrt{(2k - 1)^2 + a_k^2} + \lambda \left(17 - \sum_{k=1}^n a_k\right) \).

Taking the derivative of \( L \) with respect to each \( a_k \):

\( \frac{\partial L}{\partial a_k} = \frac{a_k}{\sqrt{(2k - 1)^2 + a_k^2}} - \lambda = 0 \).

So, for each \( k \), we have \( \frac{a_k}{\sqrt{(2k - 1)^2 + a_k^2}} = \lambda \). Let me solve for \( a_k \):

Squaring both sides gives \( \frac{a_k^2}{(2k - 1)^2 + a_k^2} = \lambda^2 \).

Rearranging terms: \( a_k^2 = \lambda^2 \left( (2k - 1)^2 + a_k^2 \right) \).

Divide both sides by \( a_k^2 \) (assuming \( a_k \neq 0 \)): \( 1 = \lambda^2 \left( \frac{(2k - 1)^2}{a_k^2} + 1 \right) \).

Simplify: \( 1 - \lambda^2 = \lambda^2 \cdot \frac{(2k - 1)^2}{a_k^2} \).

Then, \( \frac{(2k - 1)^2}{a_k^2} = \frac{1 - \lambda^2}{\lambda^2} \).

Therefore, \( \frac{2k - 1}{a_k} = \sqrt{\frac{1 - \lambda^2}{\lambda^2}} = \frac{\sqrt{1 - \lambda^2}}{\lambda} \).

Let me denote \( c = \frac{\sqrt{1 - \lambda^2}}{\lambda} \). Then, \( a_k = \frac{2k - 1}{c} \).

So, each \( a_k \) is proportional to \( (2k - 1) \). That is, \( a_k = \frac{2k - 1}{c} \).

Since the sum of all \( a_k \) is 17, we can write:

\( \sum_{k=1}^n a_k = \sum_{k=1}^n \frac{2k - 1}{c} = \frac{1}{c} \sum_{k=1}^n (2k - 1) \).

Earlier, I found that \( \sum_{k=1}^n (2k - 1) = n^2 \). Therefore,

\( \frac{n^2}{c} = 17 \) => \( c = \frac{n^2}{17} \).

Thus, \( a_k = \frac{2k - 1}{c} = \frac{(2k - 1) \cdot 17}{n^2} \).

Now, going back to the original expression for \( S_n \):

\( S_n = \sum_{k=1}^n \sqrt{(2k - 1)^2 + a_k^2} \).

Substituting \( a_k = \frac{17(2k - 1)}{n^2} \), we get:

\( \sqrt{(2k - 1)^2 + \left( \frac{17(2k - 1)}{n^2} \right)^2 } = (2k - 1) \sqrt{1 + \left( \frac{17}{n^2} \right)^2 } \).

So, factor that square root out of the sum:

\( S_n = \sqrt{1 + \left( \frac{17}{n^2} \right)^2 } \cdot \sum_{k=1}^n (2k - 1) \).

We already know that \( \sum_{k=1}^n (2k - 1) = n^2 \), so this simplifies to:

\( S_n = \sqrt{1 + \left( \frac{17}{n^2} \right)^2 } \cdot n^2 = \sqrt{n^4 + 17^2} = \sqrt{n^4 + 289} \).

Wait, that seems too simplified. Let me check my steps:

1. I set up the Lagrangian correctly.
2. Took the derivative and found \( a_k = \frac{2k - 1}{c} \).
3. Summed them up to get \( c = \frac{n^2}{17} \).
4. Plugged back into \( S_n \) and factored out \( (2k -1) \), so each term becomes \( (2k -1) \sqrt{1 + \left( \frac{17}{n^2} \right)^2 } \).
5. Since \( \sum (2k -1) = n^2 \), so total sum is \( n^2 \times \sqrt{1 + \left( \frac{17}{n^2} \right)^2 } = \sqrt{n^4 + 17^2} \).

Yeah, that seems to check out. So, \( S_n = \sqrt{n^4 + 289} \). Wait, \( 17^2 is 289.

Therefore, \( S_n = \sqrt{n^4 + 289} \). We need this to be an integer.

So, I need to find an integer \( n \) such that \( n^4 + 289 \) is a perfect square.

Let me denote \( S_n = m \), where \( m \) is an integer, so:

\( n^4 + 289 = m^2 \).

This implies \( m^2 - n^4 = 289 \).

Hmm, 289 is 17^2. So, \( m^2 - n^4 = 17^2 \). That can be written as:

\( m^2 - n^4 = (17)^2 \).

Looking at this equation, it's a difference of squares.

Wait, \( m^2 - n^4 = (m - n^2)(m + n^2) = 17^2 = 289 \).

So, we have \( (m - n^2)(m + n^2) = 289 \).

Since \( m \) and \( n \) are positive integers, both \( m - n^2 \) and \( m + n^2 \) are positive integers and factors of 289. Also, \( m + n^2 > m - n^2 \).

So, since 289 is 17^2, its positive factor pairs are (1, 289) and (17,17).

Hence, the factor pairs are:

1. \( m - n^2 = 1 \) and \( m + n^2 = 289 \).
2. \( m - n^2 = 17 \) and \( m + n^2 = 17 \).

But the second case gives \( m - n^2 = 17 \) and \( m + n^2 = 17 \).

Subtracting the equations: \( (m + n^2) - (m - n^2) = 17 - 17 \) => \( 2n^2 = 0 \) => \( n^2 = 0 \). But \( n \) is a positive integer, so this case is invalid.

So, we only consider the first factor pair: \( m - n^2 = 1 \) and \( m + n^2 = 289 \).

Adding the two equations: \( (m - n^2) + (m + n^2) = 1 + 289 \) => \( 2m = 290 \) => \( m = 145 \).

Subtracting the two equations: \( (m + n^2) - (m - n^2) = 289 - 1 \) => \( 2n^2 = 288 \) => \( n^2 = 144 \) => \( n = 12 \) since \( n \) is positive.

Therefore, \( n = 12 \).

Before I conclude, let me verify that \( S_n = \sqrt{12^4 + 17^2} = \sqrt{20736 + 289} = \sqrt{21025} = 145 \), which is indeed an integer.

Is this the only \( n \)? The question says there's a unique positive integer \( n \), so this must be the one.

**Final Answer**
The unique positive integer \( n \) is \boxed{12}.
</think>

To solve the problem, we need to find a positive integer \( n \) such that \( S_n \), the minimum value of the sum \( \sum_{k=1}^n \sqrt{(2k-1)^2 + a_k^2} \), is an integer. Here, \( a_1, a_2, \ldots, a_n \) are positive real numbers whose sum is 17.

First, we recognize that each term \( \sqrt{(2k - 1)^2 + a_k^2} \) represents the hypotenuse of a right-angled triangle with legs \( (2k - 1) \) and \( a_k \). The total vertical distance is the sum of the vertical components, which is \( \sum_{k=1}^n (2k - 1) = n^2 \). The total horizontal distance is the sum of \( a_k \), which is 17.

To minimize the sum, we use the method of Lagrange multipliers. We find that each \( a_k \) is proportional to \( (2k - 1) \). Thus, \( a_k = \frac{17(2k - 1)}{n^2} \).

Substituting this back into the expression for \( S_n \), we get:
\[ S_n = \sum_{k=1}^n \sqrt{(2k - 1)^2 + \left( \frac{17(2k - 1)}{n^2} \right)^2 } = \sqrt{n^4 + 289} \]

We need \( \sqrt{n^4 + 289} \) to be an integer. Let \( m \) be this integer, so:
\[ m^2 = n^4 + 289 \]
\[ m^2 - n^4 = 289 \]

This can be factored as:
\[ (m - n^2)(m + n^2) = 289 \]

The factor pairs of 289 are (1, 289) and (17, 17). The valid factor pair is (1, 289), leading to:
\[ m - n^2 = 1 \]
\[ m + n^2 = 289 \]

Adding and subtracting these equations, we find:
\[ 2m = 290 \implies m = 145 \]
\[ 2n^2 = 288 \implies n^2 = 144 \implies n = 12 \]

Thus, the unique positive integer \( n \) is \boxed{12}.