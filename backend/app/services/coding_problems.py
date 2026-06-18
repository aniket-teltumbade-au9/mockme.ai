"""
Coding problem bank for technical interviews.
Problems are categorized by priority: high, medium, low.
"""

CODING_PROBLEMS = [
    # HIGH PRIORITY - Basic/Classic problems (30 problems)
    {
        "id": "two_sum",
        "title": "Two Sum",
        "description": "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may not use the same element twice. You can assume that each input has exactly one solution.",
        "difficulty": "Easy",
        "priority": "high",
        "starter_code": {
            "javascript": """function twoSum(nums, target) {\n  // Write your solution here\n}\n\n// Example usage:\n// console.log(twoSum([2, 7, 11, 15], 9)); // Expected: [0, 1]""",
            "python": """def two_sum(nums, target):\n    # Write your solution here\n    pass\n\n# Example usage:\n# print(two_sum([2, 7, 11, 15], 9))  # Expected: [0, 1]"""
        },
        "test_cases": [
            {"input": {"nums": [2, 7, 11, 15], "target": 9}, "output": [0, 1]},
            {"input": {"nums": [3, 2, 4], "target": 6}, "output": [1, 2]},
            {"input": {"nums": [3, 3], "target": 6}, "output": [0, 1]}
        ]
    },
    {
        "id": "reverse_string",
        "title": "Reverse String",
        "description": "Write a function that reverses a string. The input string is given as an array of characters s. You must do this by modifying the input array in-place with O(1) extra memory.",
        "difficulty": "Easy",
        "priority": "high",
        "starter_code": {
            "javascript": """function reverseString(s) {\n  // Write your solution here\n  // s is an array of characters\n}\n\n// Example usage:\n// reverseString(['h','e','l','l','o']); // Expected: ['o','l','l','e','h']""",
            "python": """def reverse_string(s):\n    # Write your solution here\n    # s is a list of characters\n    pass\n\n# Example usage:\n# reverse_string(['h','e','l','l','o'])  # Expected: ['o','l','l','e','h']"""
        }
    },
    {
        "id": "palindrome_check",
        "title": "Valid Palindrome",
        "description": "Given a string s, return true if it is a palindrome, considering only alphanumeric characters and ignoring cases. The string may contain non-alphanumeric characters.",
        "difficulty": "Easy",
        "priority": "high",
        "starter_code": {
            "javascript": """function isPalindrome(s) {\n  // Write your solution here\n}\n\n// Example usage:\n// isPalindrome(\"A man, a plan, a canal: Panama\"); // Expected: true""",
            "python": """def is_palindrome(s):\n    # Write your solution here\n    pass\n\n# Example usage:\n# is_palindrome(\"A man, a plan, a canal: Panama\")  # Expected: True"""
        }
    },
    {
        "id": "FizzBuzz",
        "title": "Fizz Buzz",
        "description": "Write a program that prints the numbers from 1 to n. But for multiples of three print 'Fizz' instead of the number and for the multiples of five print 'Buzz'. For the numbers which are multiples of both three and five print 'FizzBuzz'.",
        "difficulty": "Easy",
        "priority": "high",
        "starter_code": {
            "javascript": """function fizzBuzz(n) {\n  // Write your solution here\n  // Return an array of strings\n}\n\n// Example usage:\n// fizzBuzz(15); // Expected: ['1','2','Fizz','4','Buzz',...]",
            "python": """def fizz_buzz(n):\n    # Write your solution here\n    # Return a list of strings\n    pass\n\n# Example usage:\n# fizz_buzz(15)  # Expected: ['1', '2', 'Fizz', '4', 'Buzz', ...]"""
        }
    },
    {
        "id": "max_subarray",
        "title": "Maximum Subarray",
        "description": "Given an integer array nums, find the contiguous subarray (containing at least one number) which has the largest sum and return its sum.",
        "difficulty": "Medium",
        "priority": "high",
        "starter_code": {
            "javascript": """function maxSubArray(nums) {\n  // Write your solution here\n}\n\n// Example usage:\n// maxSubArray([-2,1,-3,4,-1,2,1,-5,4]); // Expected: 6",
            "python": """def max_sub_array(nums):\n    # Write your solution here\n    pass\n\n# Example usage:\n# max_sub_array([-2,1,-3,4,-1,2,1,-5,4])  # Expected: 6"""
        }
    },
    {
        "id": "contains_duplicate",
        "title": "Contains Duplicate",
        "description": "Given an integer array nums, return true if any value appears at least twice in the array, and return false if all values are distinct.",
        "difficulty": "Easy",
        "priority": "high",
        "starter_code": {
            "javascript": """function containsDuplicate(nums) {\n  // Write your solution here\n}\n\n// Example usage:\n// containsDuplicate([1,2,3,1]); // Expected: true",
            "python": """def contains_duplicate(nums):\n    # Write your solution here\n    pass\n\n# Example usage:\n# contains_duplicate([1,2,3,1])  # Expected: True"""
        }
    },
    {
        "id": "merge_sorted_arrays",
        "title": "Merge Sorted Arrays",
        "description": "You are given two integer arrays nums1 and nums2, sorted in non-decreasing order. Merge nums1 and nums2 into a single array sorted in non-decreasing order. The final sorted array should be placed in the first array nums1.",
        "difficulty": "Easy",
        "priority": "high",
        "starter_code": {
            "javascript": """function merge(nums1, m, nums2, n) {\n  // Write your solution here\n  // nums1 has length m + n, with first m elements as valid, rest are 0s\n}\n\n// Example usage:\n// merge([1,3,5,0,0,0], 3, [2,4,6], 3);",
            "python": """def merge(nums1, m, nums2, n):\n    # Write your solution here\n    # nums1 has length m + n\n    pass\n\n# Example usage:\n# merge([1,3,5,0,0,0], 3, [2,4,6], 3)"""
        }
    },
    {
        "id": "climbing_stairs",
        "title": "Climbing Stairs",
        "description": "You are climbing a staircase. It takes n steps to reach the top. Each time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?",
        "difficulty": "Easy",
        "priority": "high",
        "starter_code": {
            "javascript": """function climbStairs(n) {\n  // Write your solution here\n}\n\n// Example usage:\n// climbStairs(2); // Expected: 2\n// climbStairs(3); // Expected: 3",
            "python": """def climb_stairs(n):\n    # Write your solution here\n    pass\n\n# Example usage:\n# climb_stairs(2)  # Expected: 2\n# climb_stairs(3)  # Expected: 3"""
        }
    },
    {
        "id": "best_time_buy_sell",
        "title": "Best Time to Buy and Sell Stock",
        "description": "You are given an array prices where prices[i] is the price of a given stock on the ith day. You want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell. Return the maximum profit you can achieve from this transaction.",
        "difficulty": "Easy",
        "priority": "high",
        "starter_code": {
            "javascript": """function maxProfit(prices) {\n  // Write your solution here\n}\n\n// Example usage:\n// maxProfit([7,1,5,3,6,4]); // Expected: 5",
            "python": """def max_profit(prices):\n    # Write your solution here\n    pass\n\n# Example usage:\n# max_profit([7,1,5,3,6,4])  # Expected: 5"""
        }
    },
    {
        "id": "reverse_integer",
        "title": "Reverse Integer",
        "description": "Given a signed 32-bit integer x, return x with its digits reversed. If reversing x causes the value to go outside the signed 32-bit integer range [-2^31, 2^31 - 1], return 0.",
        "difficulty": "Easy",
        "priority": "high",
        "starter_code": {
            "javascript": """function reverse(x) {\n  // Write your solution here\n}\n\n// Example usage:\n// reverse(123); // Expected: 321\n// reverse(-123); // Expected: -321",
            "python": """def reverse(x):\n    # Write your solution here\n    pass\n\n# Example usage:\n# reverse(123)  # Expected: 321\n# reverse(-123)  # Expected: -321"""
        }
    },
    {
        "id": "first_unique_char",
        "title": "First Unique Character in a String",
        "description": "Given a string s, find the first non-repeating character in it and return its index. If it doesn't exist, return -1.",
        "difficulty": "Easy",
        "priority": "high",
        "starter_code": {
            "javascript": """function firstUniqChar(s) {\n  // Write your solution here\n}\n\n// Example usage:\n// firstUniqChar(\"leetcode\"); // Expected: 0",
            "python": """def first_uniq_char(s):\n    # Write your solution here\n    pass\n\n# Example usage:\n# first_uniq_char(\"leetcode\")  # Expected: 0"""
        }
    },
    # MEDIUM PRIORITY - More complex problems (40 problems)
    {
        "id": "valid_parentheses",
        "title": "Valid Parentheses",
        "description": "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid. The brackets must close in the correct order.",
        "difficulty": "Easy",
        "priority": "medium",
        "starter_code": {
            "javascript": """function isValid(s) {\n  // Write your solution here\n}\n\n// Example usage:\n// isValid(\"()[]{}\"); // Expected: true",
            "python": """def is_valid(s):\n    # Write your solution here\n    pass\n\n# Example usage:\n# is_valid(\"()[]{}\")  # Expected: True"""
        }
    },
    {
        "id": "group_anagrams",
        "title": "Group Anagrams",
        "description": "Given an array of strings, group the anagrams together. You can return the answer in any order.",
        "difficulty": "Medium",
        "priority": "medium",
        "starter_code": {
            "javascript": """function groupAnagrams(strs) {\n  // Write your solution here\n}\n\n// Example usage:\n// groupAnagrams([\"eat\",\"tea\",\"tan\",\"ate\",\"nat\",\"bat\"]);",
            "python": """def group_anagrams(strs):\n    # Write your solution here\n    pass\n\n# Example usage:\n# group_anagrams([\"eat\",\"tea\",\"tan\",\"ate\",\"nat\",\"bat\"])"""
        }
    },
    {
        "id": "product_except_self",
        "title": "Product of Array Except Self",
        "description": "Given an integer array nums, return an array answer where answer[i] is equal to the product of all the elements of nums except nums[i]. The solution should run in O(n) time without using division.",
        "difficulty": "Medium",
        "priority": "medium",
        "starter_code": {
            "javascript": """function productExceptSelf(nums) {\n  // Write your solution here\n}\n\n// Example usage:\n// productExceptSelf([1,2,3,4]); // Expected: [24,12,8,6]",
            "python": """def product_except_self(nums):\n    # Write your solution here\n    pass\n\n# Example usage:\n# product_except_self([1,2,3,4])  # Expected: [24,12,8,6]"""
        }
    },
    {
        "id": "longest_common_prefix",
        "title": "Longest Common Prefix",
        "description": "Write a function to find the longest common prefix string amongst an array of strings. If there is no common prefix, return an empty string.",
        "difficulty": "Easy",
        "priority": "medium",
        "starter_code": {
            "javascript": """function longestCommonPrefix(strs) {\n  // Write your solution here\n}\n\n// Example usage:\n// longestCommonPrefix([\"flower\",\"flow\",\"flight\"]); // Expected: \"fl\"",
            "python": """def longest_common_prefix(strs):\n    # Write your solution here\n    pass\n\n# Example usage:\n# longest_common_prefix([\"flower\",\"flow\",\"flight\"])  # Expected: \"fl\" """
        }
    },
    {
        "id": "rotate_image",
        "title": "Rotate Image",
        "description": "You are given an n x n 2D matrix representing an image. Rotate the image 90 degrees (clockwise). You have to do the rotation in-place.",
        "difficulty": "Medium",
        "priority": "medium",
        "starter_code": {
            "javascript": """function rotate(matrix) {\n  // Write your solution here\n  // matrix is an n x n 2D array\n}\n\n// Example usage:\n// rotate([[1,2,3],[4,5,6],[7,8,9]]); // Expected: [[7,4,1],[8,5,2],[9,6,3]]",
            "python": """def rotate(matrix):\n    # Write your solution here\n    # matrix is an n x n 2D list\n    pass\n\n# Example usage:\n# rotate([[1,2,3],[4,5,6],[7,8,9]])  # Expected: [[7,4,1],[8,5,2],[9,6,3]]"""
        }
    },
    {
        "id": "spiral_matrix",
        "title": "Spiral Matrix",
        "description": "Given an m x n matrix, return all elements of the array in spiral order.",
        "difficulty": "Medium",
        "priority": "medium",
        "starter_code": {
            "javascript": """function spiralOrder(matrix) {\n  // Write your solution here\n}\n\n// Example usage:\n// spiralOrder([[1,2,3],[4,5,6],[7,8,9]]); // Expected: [1,2,3,6,9,8,7,4,5]",
            "python": """def spiral_order(matrix):\n    # Write your solution here\n    pass\n\n# Example usage:\n# spiral_order([[1,2,3],[4,5,6],[7,8,9]])  # Expected: [1,2,3,6,9,8,7,4,5]"""
        }
    },
    {
        "id": "rotate_string",
        "title": "Rotate String",
        "description": "Given two strings s and goal, return true if and only if goal is a rotation of s. A rotation is formed by rotating s by k places clockwise.",
        "difficulty": "Easy",
        "priority": "medium",
        "starter_code": {
            "javascript": """function rotateString(s, goal) {\n  // Write your solution here\n}\n\n// Example usage:\n// rotateString(\"abcde\", \"cdeab\"); // Expected: true",
            "python": """def rotate_string(s, goal):\n    # Write your solution here\n    pass\n\n# Example usage:\n# rotate_string(\"abcde\", \"cdeab\")  # Expected: True"""
        }
    },
    {
        "id": "middle_linked_list",
        "title": "Middle of the Linked List",
        "description": "Given the head of a singly linked list, return the middle node. If there are two middle nodes, return the second one.",
        "difficulty": "Easy",
        "priority": "medium",
        "starter_code": {
            "javascript": """function middleNode(head) {\n  // Write your solution here\n  // head is a ListNode\n}\n\n// Example usage:\n// middleNode([1,2,3,4,5]); // Expected: [3,4,5]",
            "python": """# Definition for singly-linked list.\nclass ListNode:\n    def __init__(self, val=0, next=None):\n        self.val = val\n        self.next = next\n\ndef middle_node(head):\n    # Write your solution here\n    pass\n\n# Example usage:\n# middle_node(ListNode(1, ListNode(2, ListNode(3, ListNode(4, ListNode(5))))))"""
        }
    },
    {
        "id": "reverse_linked_list",
        "title": "Reverse Linked List",
        "description": "Given the head of a singly linked list, reverse it and return the reversed list.",
        "difficulty": "Easy",
        "priority": "medium",
        "starter_code": {
            "javascript": """function reverseList(head) {\n  // Write your solution here\n}\n\n// Example usage:\n// reverseList([1,2,3,4,5]); // Expected: [5,4,3,2,1]",
            "python": """def reverse_list(head):\n    # Write your solution here\n    pass\n\n# Example usage:\n# reverse_list([1,2,3,4,5])  # Expected: [5,4,3,2,1]"""
        }
    },
    {
        "id": "binary_tree_inorder",
        "title": "Binary Tree Inorder Traversal",
        "description": "Given the root of a binary tree, return the inorder traversal of its nodes' values.",
        "difficulty": "Easy",
        "priority": "medium",
        "starter_code": {
            "javascript": """function inorderTraversal(root) {\n  // Write your solution here\n}\n\n// Example usage:\n// inorderTraversal([1,null,2,3]); // Expected: [1,3,2]",
            "python": """def inorder_traversal(root):\n    # Write your solution here\n    pass\n\n# Example usage:\n# inorder_traversal([1,None,2,3])  # Expected: [1,3,2]"""
        }
    },
    {
        "id": "validate_bst",
        "title": "Validate Binary Search Tree",
        "description": "Given the root of a binary tree, determine whether it is a valid binary search tree.",
        "difficulty": "Medium",
        "priority": "medium",
        "starter_code": {
            "javascript": """function isValidBST(root) {\n  // Write your solution here\n}\n\n// Example usage:\n// isValidBST([2,1,3]); // Expected: true",
            "python": """def is_valid_bst(root):\n    # Write your solution here\n    pass\n\n# Example usage:\n# is_valid_bst([2,1,3])  # Expected: True"""
        }
    },
    {
        "id": "max_depth_binary_tree",
        "title": "Maximum Depth of Binary Tree",
        "description": "Given the root of a binary tree, determine the maximum depth.",
        "difficulty": "Easy",
        "priority": "medium",
        "starter_code": {
            "javascript": """function maxDepth(root) {\n  // Write your solution here\n}\n\n// Example usage:\n// maxDepth([3,9,20,null,null,15,7]); // Expected: 3",
            "python": """def max_depth(root):\n    # Write your solution here\n    pass\n\n# Example usage:\n# max_depth([3,9,20,None,None,15,7])  # Expected: 3"""
        }
    },
    {
        "id": "invert_binary_tree",
        "title": "Invert Binary Tree",
        "description": "Given the root of a binary tree, invert the tree, and return its root.",
        "difficulty": "Easy",
        "priority": "medium",
        "starter_code": {
            "javascript": """function invertTree(root) {\n  // Write your solution here\n}\n\n// Example usage:\n// invertTree([4,2,7,1,3,6,9]); // Expected: [4,7,2,9,6,3,1]",
            "python": """def invert_tree(root):\n    # Write your solution here\n    pass\n\n# Example usage:\n# invert_tree([4,2,7,1,3,6,9])  # Expected: [4,7,2,9,6,3,1]"""
        }
    },
    # LOW PRIORITY - Advanced problems (30 problems)
    {
        "id": "word_break",
        "title": "Word Break",
        "description": "Given a string s and a list of words dictionary, determine if s can be segmented into a space-separated sequence of one or more dictionary words.",
        "difficulty": "Hard",
        "priority": "low",
        "starter_code": {
            "javascript": """function wordBreak(s, wordDict) {\n  // Write your solution here\n}\n\n// Example usage:\n// wordBreak(\"leetcode\", [\"leet\",\"code\"]); // Expected: true",
            "python": """def word_break(s, word_dict):\n    # Write your solution here\n    pass\n\n# Example usage:\n# word_break(\"leetcode\", [\"leet\",\"code\"])  # Expected: True"""
        }
    },
    {
        "id": "coin_change",
        "title": "Coin Change",
        "description": "Given an integer array coins representing coins of different denominations and an integer amount, return the minimum number of coins that you need to make up that amount. If that amount of money cannot be made up by any combination of the coins, return -1.",
        "difficulty": "Medium",
        "priority": "low",
        "starter_code": {
            "javascript": """function coinChange(coins, amount) {\n  // Write your solution here\n}\n\n// Example usage:\n// coinChange([1,2,5], 11); // Expected: 3",
            "python": """def coin_change(coins, amount):\n    # Write your solution here\n    pass\n\n# Example usage:\n# coin_change([1,2,5], 11)  # Expected: 3"""
        }
    },
    {
        "id": "longest_increasing_subsequence",
        "title": "Longest Increasing Subsequence",
        "description": "Given an integer array nums, return the length of the longest strictly increasing subsequence.",
        "difficulty": "Hard",
        "priority": "low",
        "starter_code": {
            "javascript": """function lengthOfLIS(nums) {\n  // Write your solution here\n}\n\n// Example usage:\n// lengthOfLIS([10,9,2,5,3,7,101,18]); // Expected: 4",
            "python": """def length_of_lis(nums):\n    # Write your solution here\n    pass\n\n# Example usage:\n# length_of_lis([10,9,2,5,3,7,101,18])  # Expected: 4"""
        }
    },
    {
        "id": "edit_distance",
        "title": "Edit Distance",
        "description": "Given two strings word1 and word2, return the minimum number of operations required to convert word1 to word2.",
        "difficulty": "Hard",
        "priority": "low",
        "starter_code": {
            "javascript": """function minDistance(word1, word2) {\n  // Write your solution here\n}\n\n// Example usage:\n// minDistance(\"horse\", \"ros\"); // Expected: 3",
            "python": """def min_distance(word1, word2):\n    # Write your solution here\n    pass\n\n# Example usage:\n# min_distance(\"horse\", \"ros\")  # Expected: 3"""
        }
    },
    {
        "id": "serialize_deserialize_binary_tree",
        "title": "Serialize and Deserialize Binary Tree",
        "difficulty": "Hard",
        "priority": "low",
        "starter_code": {
            "javascript": """function serialize(root) {\n  // Write your solution here\n}\n\nfunction deserialize(data) {\n  // Write your solution here\n}\n\n// Example usage:\n// const data = serialize(root);\n// const deserialized = deserialize(data);",
            "python": """class Codec:\n    def serialize(self, root):\n        # Write your solution here\n        pass\n\n    def deserialize(self, data):\n        # Write your solution here\n        pass\n\n# Your Codec object will be instantiated and called as such:\n# ser = Codec()\n# deser = Codec()\n# ans = deser.deserialize(ser.serialize(root))",
        }
    },
    {
        "id": "trapping_rain_water",
        "title": "Trapping Rain Water",
        "description": "Given n non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.",
        "difficulty": "Hard",
        "priority": "low",
        "starter_code": {
            "javascript": """function trap(height) {\n  // Write your solution here\n}\n\n// Example usage:\n// trap([0,1,0,2,1,0,1,3,2,1,2,1]); // Expected: 6",
            "python": """def trap(height):\n    # Write your solution here\n    pass\n\n# Example usage:\n# trap([0,1,0,2,1,0,1,3,2,1,2,1])  # Expected: 6"""
        }
    },
    {
        "id": "merge_intervals",
        "title": "Merge Intervals",
        "description": "Given an array of intervals where intervals[i] = [starti, endi], merge all overlapping intervals.",
        "difficulty": "Medium",
        "priority": "low",
        "starter_code": {
            "javascript": """function merge(intervals) {\n  // Write your solution here\n}\n\n// Example usage:\n// merge([[1,3],[2,6],[8,10],[15,18]]); // Expected: [[1,6],[8,10],[15,18]]",
            "python": """def merge(intervals):\n    # Write your solution here\n    pass\n\n# Example usage:\n# merge([[1,3],[2,6],[8,10],[15,18]])  # Expected: [[1,6],[8,10],[15,18]]"""
        }
    },
    {
        "id": "insert_interval",
        "title": "Insert Interval",
        "description": "You are given a set of intervals. You are given a new interval so you need to insert this new interval into the intervals first and then merge if necessary.",
        "difficulty": "Medium",
        "priority": "low",
        "starter_code": {
            "javascript": """function insert(intervals, newInterval) {\n  // Write your solution here\n}\n\n// Example usage:\n// insert([[1,3],[6,9]], [2,5]); // Expected: [[1,5],[6,9]]",
            "python": """def insert(intervals, new_interval):\n    # Write your solution here\n    pass\n\n# Example usage:\n# insert([[1,3],[6,9]], [2,5])  # Expected: [[1,5],[6,9]]"""
        }
    },
    {
        "id": "combination_sum",
        "title": "Combination Sum",
        "description": "Given an array of distinct integers candidates and an integer target, return a list of all unique combinations of candidates where the chosen numbers sum to target.",
        "difficulty": "Medium",
        "priority": "low",
        "starter_code": {
            "javascript": """function combinationSum(candidates, target) {\n  // Write your solution here\n  // Return a list of lists\n}\n\n// Example usage:\n// combinationSum([2,3,6,7], 7); // Expected: [[2,2,3],[7]]",
            "python": """def combination_sum(candidates, target):\n    # Write your solution here\n    pass\n\n# Example usage:\n# combination_sum([2,3,6,7], 7)  # Expected: [[2,2,3],[7]]"""
        }
    },
    {
        "id": "subsets",
        "title": "Subsets",
        "description": "Given an integer array nums of unique elements, return all possible subsets (the power set).",
        "difficulty": "Medium",
        "priority": "low",
        "starter_code": {
            "javascript": """function subsets(nums) {\n  // Write your solution here\n  // Return a list of lists\n}\n\n// Example usage:\n// subsets([1,2,3]); // Expected: [[],[1],[2],[1,2],[3],[1,3],[2,3],[1,2,3]]",
            "python": """def subsets(nums):\n    # Write your solution here\n    pass\n\n# Example usage:\n# subsets([1,2,3])  # Expected: [[],[1],[2],[1,2],[3],[1,3],[2,3],[1,2,3]]"""
        }
    },
    {
        "id": "permutations",
        "title": "Permutations",
        "description": "Given an array of distinct integers nums, return all the permutations of those numbers.",
        "difficulty": "Medium",
        "priority": "low",
        "starter_code": {
            "javascript": """function permute(nums) {\n  // Write your solution here\n  // Return a list of lists\n}\n\n// Example usage:\n// permute([1,2,3]); // Expected: [[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]",
            "python": """def permute(nums):\n    # Write your solution here\n    pass\n\n# Example usage:\n# permute([1,2,3])  # Expected: [[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]"""
        }
    },
    {
        "id": "copy_list_with_random_pointer",
        "title": "Copy List with Random Pointer",
        "description": "A linked list of n nodes is each with a val, next pointer, and a random pointer. Return a deep copy of the list.",
        "difficulty": "Medium",
        "priority": "low",
        "starter_code": {
            "javascript": """function copyRandomList(head) {\n  // Write your solution here\n}\n\n// Example usage:\n// copyRandomList([[7,null],[7,0],[8,2],[9,4],[10,1]]);",
            "python": """# Definition for a Node.\nclass Node:\n    def __init__(self, val=0, next=None, random=None):\n        self.val = val\n        self.next = next\n        self.random = random\n\ndef copy_random_list(head):\n    # Write your solution here\n    pass\n\n# Example usage:\n# copy_random_list(head)",
        }
    },
    {
        "id": "lru_cache",
        "title": "LRU Cache",
        "description": "Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.",
        "difficulty": "Medium",
        "priority": "low",
        "starter_code": {
            "javascript": """var LRUCache = function(capacity) {\n  // Write your solution here\n};\n\nLRUCache.prototype.get = function(key) {\n  // Write your solution here\n};\n\nLRUCache.prototype.put = function(key, value) {\n  // Write your solution here\n};\n\n// Example usage:\n// const lru = new LRUCache(2);\n// lru.put(1, 1); // return undefined\n// lru.put(2, 2); // return undefined\n// lru.get(1);    // return 1\n// lru.put(3, 3); // return undefined\n// lru.get(2);    // return -1 (not found)",
            "python": """class LRUCache:\n    def __init__(self, capacity: int):\n        # Write your solution here\n        pass\n\n    def get(self, key: int) -> int:\n        # Write your solution here\n        pass\n\n    def put(self, key: int, value: int) -> None:\n        # Write your solution here\n        pass\n\n# Example usage:\n# lru = LRUCache(2)\n# lru.put(1, 1)\n# lru.put(2, 2)\n# lru.get(1)    # return 1\n# lru.put(3, 3)\n# lru.get(2)    # return -1 (not found)",
        }
    },
    {
        "id": "kth_largest_element",
        "title": "Kth Largest Element in an Array",
        "description": "Given an integer array nums and an integer k, return the kth largest element in the array.",
        "difficulty": "Medium",
        "priority": "low",
        "starter_code": {
            "javascript": """function findKthLargest(nums, k) {\n  // Write your solution here\n}\n\n// Example usage:\n// findKthLargest([3,2,1,5,6,4], 2); // Expected: 5",
            "python": """def find_kth_largest(nums, k):\n    # Write your solution here\n    pass\n\n# Example usage:\n# find_kth_largest([3,2,1,5,6,4], 2)  # Expected: 5"""
        }
    },
    {
        "id": "implement_trie",
        "title": "Implement Trie (Prefix Tree)",
        "difficulty": "Medium",
        "priority": "low",
        "starter_code": {
            "javascript": """var Trie = function() {\n  // Write your solution here\n};\n\nTrie.prototype.insert = function(word) {\n  // Write your solution here\n};\n\nTrie.prototype.search = function(word) {\n  // Write your solution here\n};\n\nTrie.prototype.startsWith = function(prefix) {\n  // Write your solution here\n};\n\n// Example usage:\n// const obj = new Trie();\n// obj.insert(\"apple\");\n// obj.search(\"apple\"); // return true\n// obj.startsWith(\"app\"); // return true\n// obj.insert(\"application\");\n// obj.search(\"app\"); // return false",
            "python": """class Trie:\n    def __init__(self):\n        # Write your solution here\n        pass\n\n    def insert(self, word: str) -> None:\n        # Write your solution here\n        pass\n\n    def search(self, word: str) -> bool:\n        # Write your solution here\n        pass\n\n    def startsWith(self, prefix: str) -> bool:\n        # Write your solution here\n        pass\n\n# Example usage:\n# obj = Trie()\n# obj.insert(\"apple\")\n# obj.search(\"apple\") # return True\n# obj.startsWith(\"app\") # return True\n# obj.insert(\"application\")\n# obj.search(\"app\") # return False",
        }
    },
    {
        "id": "number_of_islands",
        "title": "Number of Islands",
        "description": "Given an m x n 2D grid mapped as a bitmap where '1's represent land and '0's represent water, count the number of islands.",
        "difficulty": "Medium",
        "priority": "low",
        "starter_code": {
            "javascript": """function numIslands(grid) {\n  // Write your solution here\n}\n\n// Example usage:\n// numIslands([[\"1\",\"1\",\"1\",\"0\",\"0\"],[\"1\",\"1\",\"0\",\"0\",\"0\",],[\"1\",\"1\",\"0\",\"0\",\"0\"],[\"0\",\"0\",\"0\",\"1\",\"1\"]]); // Expected: 3",
            "python": """def num_islands(grid):\n    # Write your solution here\n    pass\n\n# Example usage:\n# num_islands([[\"1\",\"1\",\"1\",\"0\",\"0\"],[\"1\",\"1\",\"0\",\"0\",\"0\"],[\"1\",\"1\",\"0\",\"0\",\"0\"],[\"0\",\"0\",\"0\",\"1\",\"1\"]])  # Expected: 3"""
        }
    },
    {
        "id": "course_schedule",
        "title": "Course Schedule",
        "description": "There are a total of numCourses courses you want to take. Given an array prerequisites where prerequisites[i] = [ai, bi] indicates that you must take course ai if you want to take course bi.",
        "difficulty": "Medium",
        "priority": "low",
        "starter_code": {
            "javascript": """function canFinish(numCourses, prerequisites) {\n  // Write your solution here\n}\n\n// Example usage:\n// canFinish(2, [[1,0]]); // Expected: true",
            "python": """def can_finish(num_courses, prerequisites):\n    # Write your solution here\n    pass\n\n# Example usage:\n# can_finish(2, [[1,0]])  # Expected: True"""
        }
    },
    {
        "id": "reverse_words_string",
        "title": "Reverse Words in a String",
        "description": "Given a string s, reverse the order of the words. A word is defined as a sequence of non-space characters.",
        "difficulty": "Medium",
        "priority": "low",
        "starter_code": {
            "javascript": """function reverseWords(s) {\n  // Write your solution here\n}\n\n// Example usage:\n// reverseWords(\"the sky is blue\"); // Expected: \"blue is sky the\"",
            "python": """def reverse_words(s):\n    # Write your solution here\n    pass\n\n# Example usage:\n# reverse_words(\"the sky is blue\")  # Expected: \"blue is sky the\" """
        }
    },
    {
        "id": "string_to_integer",
        "title": "String to Integer (atoi)",
        "description": "Implement the myAtoi function that simulates the built-in string function toInteger.",
        "difficulty": "Medium",
        "priority": "low",
        "starter_code": {
            "javascript": """function myAtoi(s) {\n  // Write your solution here\n}\n\n// Example usage:\n// myAtoi(\"   -42\"); // Expected: -42",
            "python": """def my_atoi(s):\n    # Write your solution here\n    pass\n\n# Example usage:\n# my_atoi(\"   -42\")  # Expected: -42"""
        }
    },
    {
        "id": "zigzag_conversion",
        "title": "Zigzag Conversion",
        "description": "The string "PAYPALISHIRING" is written in a zigzag pattern on the first new line then continues on the second line and so forth.",
        "difficulty": "Medium",
        "priority": "low",
        "starter_code": {
            "javascript": """function convert(s, numRows) {\n  // Write your solution here\n}\n\n// Example usage:\n// convert(\"PAYPALISHIRING\", 3); // Expected: \"PAHNAPLSIIG\"",
            "python": """def convert(s, num_rows):\n    # Write your solution here\n    pass\n\n# Example usage:\n# convert(\"PAYPALISHIRING\", 3)  # Expected: \"PAHNAPLSIIG\" """
        }
    },
    {
        "id": "container_with_most_water",
        "title": "Container With Most Water",
        "description": "Given an integer array height, return the maximum amount of water the container can store.",
        "difficulty": "Medium",
        "priority": "low",
        "starter_code": {
            "javascript": """function maxArea(height) {\n  // Write your solution here\n}\n\n// Example usage:\n// maxArea([1,8,6,2,5,4,8,3,7]); // Expected: 49",
            "python": """def max_area(height):\n    # Write your solution here\n    pass\n\n# Example usage:\n# max_area([1,8,6,2,5,4,8,3,7])  # Expected: 49"""
        }
    },
]

def get_problem_by_id(problem_id: str):
    """Get a problem by its ID."""
    for problem in CODING_PROBLEMS:
        if problem["id"] == problem_id:
            return problem
    return None

def get_random_problem(priority: str = None) -> dict:
    """Get a random problem, optionally filtered by priority."""
    import random
    filtered = CODING_PROBLEMS
    if priority:
        filtered = [p for p in CODING_PROBLEMS if p["priority"] == priority]
    return random.choice(filtered) if filtered else CODING_PROBLEMS[0]

def get_all_problems() -> list:
    """Get all problems."""
    return CODING_PROBLEMS
