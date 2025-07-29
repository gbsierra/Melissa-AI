import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Animated from 'react-native-reanimated';
import { FadeIn, FadeOut } from 'react-native-reanimated';
import { SwipeListView } from 'react-native-swipe-list-view';
import { useRouter } from 'expo-router';
import type { Recipe } from '../types/recipe';

type Props = {
  savedRecipes: Recipe[];
  deleteRecipe: (index: number) => void;
};

export const SavedRecipesList: React.FC<Props> = ({ savedRecipes, deleteRecipe }) => {
  const router = useRouter();

  if (savedRecipes.length === 0) return null;

  return (
    <View style={{ marginTop: 30, overflow: 'hidden' }}>

      <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 10 }}>
        📁 Saved Recipes
      </Text>

      {/* List with Swipe to Delete */}
      <SwipeListView
        data={savedRecipes}
        keyExtractor={(_, index) => `recipe-${index}`} // Prevent stale index reuse
        style={{ flexGrow: 0 }}
        showsVerticalScrollIndicator={true}
        rightOpenValue={-80}
        disableRightSwipe

        // Visible Recipe Card
        renderItem={({ item, index }) => (
          <View style={{ overflow: 'hidden', marginBottom: 12 }}>
            <Animated.View entering={FadeIn} exiting={FadeOut}>
              <TouchableOpacity
                style={{
                  padding: 12,
                  backgroundColor: '#fff',
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: '#eee',
                }}
                onPress={() =>
                  router.push({
                    pathname: '/recipe',
                    params: {
                      dishName: item.dishName ?? '',
                      ingredients: JSON.stringify(item.ingredients ?? []),
                      instructions: JSON.stringify(item.instructions ?? []),
                      servings: String(item.servings ?? ''),
                      text: item.prompt ?? '',
                      photo: item.photo ?? '',
                    },
                  })
                }
              >
                <Text
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  style={{ fontSize: 16, fontWeight: '600', color: '#FF6347' }}
                >
                  {item.dishName || 'Untitled Dish'}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        )}

        // Delete background (only appears during swipe)
        renderHiddenItem={({ index }, rowMap) => (
          <Animated.View
            entering={FadeIn.duration(800).delay(100)}
            style={{
              marginBottom: 12,
              backgroundColor: '#FF4D4D',
              borderRadius: 10,
              borderWidth: 1,
              borderColor: '#eee',         // 👈 Match card border
              alignItems: 'flex-end',
              justifyContent: 'center',
              paddingHorizontal: 20,
              paddingVertical: 12,         // 👈 Match recipe card padding
              width: '100%',
            }}
          >
            <TouchableOpacity
              onPress={() => {
                // Close all open swipe rows before deleting
                Object.keys(rowMap).forEach((key) => {
                  rowMap[key]?.closeRow();
                });
                
                deleteRecipe(index); // Remove the selected item

                delete rowMap[index]; // Optionally clean up the deleted row's mapping
                
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '600' }}>Delete</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      />

    </View>
  );
};