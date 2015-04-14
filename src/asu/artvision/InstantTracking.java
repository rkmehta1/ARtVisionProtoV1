package asu.artvision;// Copyright 2007-2014 metaio GmbH. All rights reserved.

import java.io.File;
import java.io.FileInputStream;

import android.media.MediaPlayer;
import android.os.Bundle;
import android.util.Log;
import android.view.View;

import com.metaio.R;
import com.metaio.sdk.ARViewActivity;
import com.metaio.sdk.MetaioDebug;
import com.metaio.sdk.jni.IGeometry;
import com.metaio.sdk.jni.IMetaioSDKAndroid;
import com.metaio.sdk.jni.IMetaioSDKCallback;
import com.metaio.sdk.jni.Rotation;
import com.metaio.sdk.jni.TrackingValues;
import com.metaio.tools.io.AssetsManager;

public class InstantTracking extends ARViewActivity
{

    /**
     * lady with water geometry
     */
    private IGeometry ladyWithWater;

    /**
     * metaio SDK callback handler
     */
    private MetaioSDKCallbackHandler mCallbackHandler;

    /**
     * Flag to indicate proximity to the ladywithwater
     */
    boolean mIsCloseToLady;

    /**
     * Media Player to play the sound of the tiger
     */
    MediaPlayer mMediaPlayer;

    private View m2DButton;


    /**
     * The flag indicating a mode of instant tracking
     *
     * @see {@link IMetaioSDKAndroid#startInstantTracking(String, String, boolean)}
     */
    boolean mPreview = true;

    /**
     * Whether to set tracking configuration on onInstantTrackingEvent
     */
    boolean mMustUseInstantTrackingEvent = false;

    @Override
    public void onCreate(Bundle savedInstanceState)
    {
        super.onCreate(savedInstanceState);

        try
        {
            ladyWithWater = null;
            mCallbackHandler = new MetaioSDKCallbackHandler();
            mIsCloseToLady = false;
            mMediaPlayer = new MediaPlayer();
            FileInputStream fis =
                    new FileInputStream(AssetsManager.getAssetPathAsFile(getApplicationContext(),
                            "/Users/RajeevMehta/Desktop/metaioSDK/_Android/Examples_SDK/CustomRenderer/assets/Water\\ Pitcher\\ 1\\ no\\ frame.jpg"));
            mMediaPlayer.setDataSource(fis.getFD());
            mMediaPlayer.prepare();
            fis.close();

            m2DButton = mGUIView.findViewById(R.id.instant2DButton);

        }
        catch (Exception e)
        {
            mMediaPlayer = null;
        }
    }

    @Override
    protected void onDestroy()
    {
        super.onDestroy();
        mCallbackHandler.delete();
        mCallbackHandler = null;
        try
        {
            mMediaPlayer.release();
        }
        catch (Exception e)
        {
        }
    }

    /**
     * This method is regularly called in the rendering loop. It calculates the distance between
     * device and the target and performs actions based on the proximity
     */
    private void checkDistanceToTarget()
    {
        // get tracking values for COS 1
        TrackingValues tv = metaioSDK.getTrackingValues(1);

        // Note, you can use this mechanism also to detect if something is tracking or not.
        // (e.g. for triggering an action as soon as some target is visible on screen)
        if (tv.isTrackingState())
        {
            // calculate the distance as sqrt( x^2 + y^2 + z^2 )
            final float distance = tv.getTranslation().norm();

            // define a threshold distance
            final float threshold = 200;

            // moved close to the tiger
            if (distance < threshold)
            {
                // if not already close to the model
                if (!mIsCloseToLady)
                {
                    MetaioDebug.log("Moved close to the lady");
                    mIsCloseToLady = true;
                    playSound();
                    ladyWithWater.startAnimation("tap");
                }
            }
            else
            {
                if (mIsCloseToLady)
                {
                    MetaioDebug.log("Moved away from the lady");
                    mIsCloseToLady = false;
                }
            }

        }
    }

    /**
     * Play sound that has been loaded
     */
    private void playSound()
    {
        try
        {
            MetaioDebug.log("Playing sound");
            mMediaPlayer.start();
        }
        catch (Exception e)
        {
            MetaioDebug.log("Error playing sound: " + e.getMessage());
        }
    }


    @Override
    protected int getGUILayout()
    {
        return R.layout.tutorial_instant_tracking;
    }

    @Override
    protected IMetaioSDKCallback getMetaioSDKCallbackHandler()
    {
        return mCallbackHandler;
    }

    @Override
    public void onDrawFrame()
    {
        super.onDrawFrame();

        checkDistanceToTarget();

    }

    public void onButtonClick(View v)
    {
        finish();
    }

    public void on2DButtonClicked(View v)
    {
        mMustUseInstantTrackingEvent = true;
        ladyWithWater.setVisible(false);

        metaioSDK.startInstantTracking("INSTANT_2D", new File("/Users/RajeevMehta/Desktop/metaioSDK/_Android/Examples_SDK/CustomRenderer/assets/Vermeer\\,\\ Young\\ Woman\\ with\\ a\\ Water\\ Pitcher\\,\\ \\ c.\\ 1662.mp3"), mPreview);
        mPreview = !mPreview;
    }



    @Override
    protected void loadContents()
    {
        try
        {
            // Load tiger model
            final File ladyModelPath =
                    AssetsManager.getAssetPathAsFile(getApplicationContext(), "/Users/RajeevMehta/Desktop/metaioSDK/_Android/Examples_SDK/CustomRenderer/assets/Water\\ Pitcher\\ 1\\ no\\ frame.jpg");
            ladyWithWater = metaioSDK.createGeometry(ladyModelPath);

            // Set geometry properties and initially hide it
            ladyWithWater.setScale(8f);
            ladyWithWater.setRotation(new Rotation(0f, 0f, (float) Math.PI));
            ladyWithWater.setVisible(false);
            ladyWithWater.setAnimationSpeed(60f);
            //ladyWithWater.startAnimation("meow");
           MetaioDebug.log("Loaded geometry " + ladyModelPath);
        }
        catch (Exception e)
        {
            MetaioDebug.log(Log.ERROR, "Error loading geometry: " + e.getMessage());
        }
    }


//    @Override
//    protected void onGeometryTouched(IGeometry geometry)
//    {
//        playSound();
//        geometry.startAnimation("tap");
//    }

    final class MetaioSDKCallbackHandler extends IMetaioSDKCallback
    {

        @Override
        public void onSDKReady()
        {
            // show GUI
            runOnUiThread(new Runnable()
            {
                @Override
                public void run()
                {
                    mGUIView.setVisibility(View.VISIBLE);
                }
            });
        }


        @Override
        public void onInstantTrackingEvent(boolean success, File filePath)
        {
            if (success)
            {
                // Since SDK 6.0, INSTANT_3D doesn't create a new tracking configuration anymore
                // (see changelog)
                if (mMustUseInstantTrackingEvent)
                {
                    MetaioDebug.log("MetaioSDKCallbackHandler.onInstantTrackingEvent: " + filePath.getPath());
                    metaioSDK.setTrackingConfiguration(filePath);
                }

                ladyWithWater.setVisible(true);
            }
            else
            {
                MetaioDebug.log(Log.ERROR, "Failed to create instant tracking configuration!");
            }
        }

//        @Override
//        public void onAnimationEnd(IGeometry geometry, String animationName)
//        {
//            // Play a random animation from the list
//            final String[] animations = {"meow", "scratch", "look", "shake", "clean"};
//            final int random = (int)(Math.random() * animations.length);
//            geometry.startAnimation(animations[random]);
//        }
    }

}