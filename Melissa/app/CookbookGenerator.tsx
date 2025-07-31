// CookbookGeneratorPage.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, SafeAreaView, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import Checkbox from 'expo-checkbox';
import { useSavedRecipes } from '../hooks/useSavedRecipes';
import { useCookbookGenerator } from '../hooks/useCookbookGenerator'; // <-- NEW
import { WebView } from 'react-native-webview';
import type { Recipe } from '../types/recipe';
import * as Sharing from 'expo-sharing';


export default function CookbookGeneratorPage() {
    const [selected, setSelected] = useState<number[]>([]);
    const { savedRecipes, loadSavedRecipes } = useSavedRecipes();
    const router = useRouter();
    const [modalVisible, setModalVisible] = useState(false);

    const { pdfUri, loading, generateCookbook } = useCookbookGenerator(); // <-- NEW

    useEffect(() => {
        loadSavedRecipes();
    }, []);

    const toggleSelection = (index: number) => {
        setSelected((prev) =>
            prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
        );
    };

    const handleGenerate = async () => {
        const selectedRecipes: Recipe[] = selected.map((i) => savedRecipes[i]);
        console.log('[Cookbook] Selected recipes:', JSON.stringify(selectedRecipes, null, 2));

        const uri = await generateCookbook(selectedRecipes);
        if (uri) {
            setModalVisible(true);
        }
    };

    const handleShare = async () => {
        if (pdfUri) {
            await Sharing.shareAsync(pdfUri);
        }
    };

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={{ padding: 20 }}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Text style={styles.backButtonText}>⬅ Back</Text>
                </TouchableOpacity>

                <Text style={styles.heading}>📚 Select Recipes for Your Cookbook</Text>

                {savedRecipes.length === 0 ? (
                    <TouchableOpacity onPress={() => router.back()}>
                        <Text style={styles.noRecipesText}>No saved recipes! Create a recipe now</Text>
                    </TouchableOpacity>
                ) : (
                    <>
                        {savedRecipes.map((recipe, index) => (
                            <TouchableOpacity
                                key={index}
                                style={styles.recipeCard}
                                onPress={() => toggleSelection(index)}
                            >
                                <Checkbox value={selected.includes(index)} onValueChange={() => toggleSelection(index)} />
                                <Text style={styles.recipeTitle}>{recipe.dishName}</Text>
                            </TouchableOpacity>
                        ))}

                        <TouchableOpacity
                            style={[styles.button, (selected.length === 0 || loading) && styles.buttonDisabled]}
                            onPress={handleGenerate}
                            disabled={selected.length === 0 || loading}
                        >
                            <Text style={styles.buttonText}>
                                {loading ? 'Generating...' : 'Generate Cookbook PDF'}
                            </Text>
                        </TouchableOpacity>
                    </>
                )}
            </ScrollView>

            <Modal visible={modalVisible} transparent animationType="fade">
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalText}>✅ Your cookbook is ready!</Text>
                        {pdfUri && (
                            <View style={{ height: 300, width: '100%', marginBottom: 20 }}>
                                <WebView
                                    source={{ uri: pdfUri }}
                                    style={{ flex: 1 }}
                                    originWhitelist={['*']}
                                />
                            </View>
                        )}
                        <TouchableOpacity style={styles.button} onPress={handleShare}>
                            <Text style={styles.buttonText}>Share or Save PDF</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setModalVisible(false)}>
                            <Text style={styles.closeText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    heading: {
        fontSize: 20,
        fontWeight: '600',
        marginBottom: 20,
    },
    recipeCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        marginBottom: 10,
    },
    recipeTitle: {
        marginLeft: 12,
        fontSize: 16,
        fontWeight: '500',
    },
    button: {
        marginTop: 30,
        padding: 14,
        backgroundColor: '#FF6347',
        borderRadius: 10,
    },
    buttonDisabled: {
        backgroundColor: '#ccc',
    },
    buttonText: {
        color: '#fff',
        textAlign: 'center',
        fontWeight: '600',
    },
    backButton: {
        marginBottom: 20,
    },
    backButtonText: {
        color: '#888',
        fontSize: 16,
    },
    noRecipesText: {
        fontSize: 16,
        color: '#FF6347',
        textAlign: 'center',
        marginTop: 40,
        fontWeight: '500',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    modalContent: {
        backgroundColor: '#fff',
        padding: 24,
        borderRadius: 12,
        alignItems: 'center',
        width: '90%',
        maxHeight: '90%',
    },
    modalText: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 20,
    },
    closeText: {
        marginTop: 20,
        color: '#888',
        fontWeight: '500',
    },
});
